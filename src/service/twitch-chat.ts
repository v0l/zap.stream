import EventEmitter from "eventemitter3";

export interface TwitchChatEvents {
  chat: (meta: SubscriptionMetadata, event: ChatNotificationEvent) => void
}

export class TwitchChat extends EventEmitter<TwitchChatEvents> {
  private clientId: string;
  private bearer?: string;
  token?: TokenValidationResponse;
  private ws?: WebSocket;
  private session?: SesssionInfo;
  private subscriptions: Map<string, SubscriptionPayload> = new Map();

  constructor(clientId: string, bearer?: string) {
    super();
    this.clientId = clientId;
    this.bearer = bearer;
  }

  get connected_at() {
    const ct = this.session?.connected_at;
    if (ct) {
      return Math.floor(new Date(ct).getTime() / 1000);
    }
  }

  get login() {
    return this.token?.login;
  }

  static getAuthUrl(clientId: string, redirect_uri: string, scopes: Array<string>, state?: string) {
    const params = [
      "response_type=token",
      `client_id=${encodeURIComponent(clientId)}`,
      `redirect_uri=${encodeURIComponent(redirect_uri)}`,
      `scope=${encodeURIComponent(scopes.join(" "))}`
    ];
    if (state) {
      params.push(`state=${encodeURIComponent(state)}`);
    }
    return `https://id.twitch.tv/oauth2/authorize?${params.join("&")}`;
  }

  async connect() {
    // first validate the token
    const tkn = await this.validateToken();
    this.token = tkn;
    console.debug("Token is valid", tkn);

    const ws = await new Promise<WebSocket>((resolve, reject) => {
      const ws = new WebSocket("wss://eventsub.wss.twitch.tv/ws");
      ws.onopen = (ev) => {
        console.debug("Connected", ev);
      }
      ws.onmessage = (ev) => {
        this.onMessage(ev, () => {
          resolve(ws);
        });
      }
      ws.onclose = (ev) => {
        console.debug("CLOSED", ev);
      }
      ws.onerror = (ev) => {
        console.debug("ERROR", ev);
        reject(ev);
      }
    });

    this.ws = ws;
  }

  private onMessage(ev: MessageEvent, onWelcome?: () => void) {
    const json = typeof ev.data === "string" ? JSON.parse(ev.data) as { metadata: { message_type: MessageMetadata["message_type"] } } : undefined;

    if (!json) {
      console.warn("Unknown message", ev.data);
      return;
    }

    switch (json.metadata.message_type) {
      case "session_welcome": {
        const msg = json as WelcomeMessage;
        console.debug("Got session", msg);
        this.session = msg.payload.session;
        onWelcome?.();
        break;
      }
      case "notification": {
        const msg = json as NotificationMessage;
        console.debug("Got notification", msg);
        this.onNotification(msg);
        break;
      }
    }
  }

  /**
   * Handle notification EventSub events
   * @param notification 
   */
  private onNotification(notification: NotificationMessage) {
    switch (notification.metadata.subscription_type) {
      case SubscriptionType.ChannelChatMessage: {
        this.emit("chat", notification.metadata, notification.payload.event as ChatNotificationEvent);
        break;
      }
    }
  }

  async validateToken() {
    if (!this.bearer) {
      throw new Error("Cant validate token without bearer token");
    }

    const rsp = await fetch("https://id.twitch.tv/oauth2/validate", {
      headers: {
        authorization: `OAuth ${this.bearer}`
      }
    });
    const validation = await rsp.json();
    return validation as TokenValidationResponse;
  }

  async subscribeMyChat() {
    if (!this.token?.user_id) {
      throw new Error("Token not found, cant subscribe to chat");
    }
    await this.subscribeChat(this.token.user_id);
  }

  async subscribeChat(user_id: string) {
    if (!this.session?.id) {
      throw new Error("Cant subscribe with no websocket connection");
    }
    if (!this.bearer) {
      throw new Error("Cant subscribe without bearer token");
    }

    const payload = {
      type: SubscriptionType.ChannelChatMessage,
      version: "1",
      condition: {
        broadcaster_user_id: user_id,
        user_id: user_id
      },
      transport: {
        method: "websocket",
        session_id: this.session.id
      }
    } satisfies SubscriptionRequest;
    const rsp = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        "Client-Id": this.clientId,
        "authorization": `Bearer ${this.bearer}`
      },
      body: JSON.stringify(payload)
    });

    const sub = (await rsp.json()) as ApiResponse<SubscriptionPayload>;
    const subInfo = sub.data[0];
    this.subscriptions.set(subInfo.id, subInfo);
  }

  async getChannelBadges(channel_id: string) {
    if (!this.bearer) {
      throw new Error("Cant subscribe without bearer token");
    }
    const rsp = await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${channel_id}`, {
      headers: {
        "Client-Id": this.clientId,
        "authorization": `Bearer ${this.bearer}`
      }
    });

    const data = await rsp.json();
    return (data as { data: Array<BadgeSet> }).data;
  }

  async getGlobalBadges() {
    if (!this.bearer) {
      throw new Error("Cant subscribe without bearer token");
    }
    const rsp = await fetch("https://api.twitch.tv/helix/chat/badges/global", {
      headers: {
        "Client-Id": this.clientId,
        "authorization": `Bearer ${this.bearer}`
      }
    });

    const data = await rsp.json();
    return (data as { data: Array<BadgeSet> }).data;
  }

  /** Gracefully close the connection. */
  disconnect(): void {
    this.ws?.close();
  }
}

export enum SubscriptionType {
  ChannelChatMessage = "channel.chat.message"
}

export interface TokenValidationResponse {
  client_id: string;
  expires_in: number;
  /**
   * Username of the login
   */
  login?: string;
  scopes: Array<string>;
  /**
   * Twitch user id
   */
  user_id: string;
}
export interface SubscriptionRequest {
  type: SubscriptionType,
  version: string;
  condition: object;
  transport: TransportInfo,
}
export interface ApiResponse<T> {
  data: Array<T>,
  total: number;
  total_cost: number;
  max_total_cost: number;
}

export interface TransportInfo {
  method: "webhook" | "websocket" | "conduit",
  callback?: string;
  secret?: string;
  /**
   * WebSocket session_id
   */
  session_id?: string;
  /**
   * Time when websocket was connected
   */
  connected_at?: string;
  conduit_id?: string;
}

export interface MessageMetadata {
  message_id: string;
  message_type: "session_welcome" | "session_keepalive" | "notification";
  message_timestamp: string;
}

export type SubscriptionMetadata = MessageMetadata & {
  subscription_type: string;
  subscription_version: string;
}

export interface SesssionInfo {
  id: string;
  status: string;
  keepalive_timeout_seconds: number;
  reconnect_url?: string;
  connected_at: string;
}

export interface SubscriptionPayload {
  id: string;
  status: "enabled" | "webhook_callback_verification_pending";
  type: SubscriptionType;
  version: string;
  cost: number;
  condition: object;
  transport: TransportInfo,
  created_at: string;
}

export enum ChatMessageType {
  Text = "text",
  ChannelPointsHightlighted = "channel_points_highlighted",
  ChannelPointsSubOnly = "channel_points_sub_only",
  UserIntro = "user_intro",
  PowerUpsMessageEffect = "power_ups_message_effect",
  PowerUpsGigantifiedEmote = "power_ups_gigantified_emote"
}

export interface ChatNotificationEvent {
  chatter_user_name: string;
  message: {
    text: string;
    fragments: Array<object>,
  }
  message_type: ChatMessageType,
  color?: string,
  badges: Array<ChatBadge>
}

export interface ChatBadge {
  set_id: string,
  id: string,
  info: string
}

export interface BadgeSet {
  set_id: string;
  versions: Array<{
    id: string;
    image_url_1x: string;
    image_url_2x: string;
    image_url_4x: string;
    title: string;
    description: string;
    click_action?: string;
    click_url?: string;
  }>;
}

export interface MessageTemplate<M extends MessageMetadata, P> {
  metadata: M;
  payload: P
}

export type WelcomeMessage = MessageTemplate<MessageMetadata, { session: SesssionInfo }>;
export type NotificationMessage = MessageTemplate<SubscriptionMetadata, { subscription: SubscriptionPayload, event?: object }>;
export type ReconnectMessage = MessageTemplate<MessageMetadata, { session: SesssionInfo }>;
export type RevocationMessage = MessageTemplate<SubscriptionMetadata, { subscription: SubscriptionPayload }>;