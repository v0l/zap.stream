import EventEmitter from "eventemitter3"
import type { ChatInfo, ExternalChatFeed, ExternalChatEvents, ExternalChatBadge } from "./types"

const EventSubUrl = "wss://eventsub.wss.twitch.tv/ws"

export class TwitchChat extends EventEmitter<ExternalChatEvents> implements ExternalChatFeed {
  private clientId: string
  private bearer?: string
  token?: TokenValidationResponse
  private ws?: WebSocket
  private session?: SesssionInfo
  private subscriptions: Map<string, SubscriptionPayload> = new Map()
  private closing = false
  private retryTimer?: ReturnType<typeof setTimeout>
  private keepaliveTimer?: ReturnType<typeof setTimeout>
  private retries = 0

  constructor(
    clientId: string,
    bearer?: string,
    private readonly retryDelayMs = 2000,
  ) {
    super()
    this.clientId = clientId
    this.bearer = bearer
  }

  currentViewers(): Promise<number | undefined> {
    throw new Error("Method not implemented.")
  }

  async getBadges(): Promise<Array<ExternalChatBadge>> {
    const badgeTasks = [this.getGlobalBadges()]
    if (this.token?.user_id) {
      badgeTasks.push(this.getChannelBadges(this.token.user_id))
    }
    return (await Promise.all(badgeTasks)).flat().flatMap(b => {
      return b.versions.map(x => ({
        feed: "twitch",
        id: `${b.set_id}_${x.id}`,
        url: x.image_url_2x,
      }))
    })
  }

  async connectFeed() {
    this.closing = false
    await this.connectSocket()
    await this.subscribeMyChat()
  }

  getInfo(): ChatInfo {
    return {
      connected: this.connected_at || 0,
      name: this.login ?? "",
      provider_name: "Twitch",
    }
  }

  get connected_at() {
    const ct = this.session?.connected_at
    if (ct) {
      return Math.floor(new Date(ct).getTime() / 1000)
    }
    return undefined
  }

  get login() {
    return this.token?.login
  }

  async connectSocket() {
    this.token = await this.validateToken()
    this.ws = await this.openSocket(EventSubUrl)
  }

  private openSocket(url: string) {
    return new Promise<WebSocket>((resolve, reject) => {
      const ws = new WebSocket(url)
      let welcomed = false
      ws.onmessage = ev => {
        if (ws === this.ws) this.armKeepalive()
        this.onMessage(ws, ev, () => {
          welcomed = true
          resolve(ws)
        })
      }
      ws.onclose = () => {
        if (!welcomed) reject(new Error("Twitch socket closed before welcome"))
        if (ws === this.ws) this.onSocketLost()
      }
      ws.onerror = ev => {
        if (!welcomed) reject(ev)
      }
    })
  }

  private armKeepalive() {
    clearTimeout(this.keepaliveTimer)
    const timeout = this.session?.keepalive_timeout_seconds
    if (!timeout || this.closing) return
    const ws = this.ws
    this.keepaliveTimer = setTimeout(
      () => {
        if (ws === this.ws) ws?.close()
      },
      (timeout + 5) * 1000,
    )
  }

  private onSocketLost() {
    clearTimeout(this.keepaliveTimer)
    this.ws = undefined
    if (this.closing) return
    const delay = Math.min(this.retryDelayMs * 2 ** this.retries, 60_000)
    this.retries++
    this.retryTimer = setTimeout(() => this.reconnect(), delay)
  }

  private async reconnect() {
    if (this.closing) return
    try {
      this.subscriptions.clear()
      const ws = await this.openSocket(EventSubUrl)
      if (this.closing) {
        ws.close()
        return
      }
      this.ws = ws
      this.armKeepalive()
      await this.subscribeMyChat()
      this.retries = 0
    } catch (e) {
      console.warn("Twitch reconnect failed", e)
      if (this.ws) {
        this.ws.close()
      } else {
        this.onSocketLost()
      }
    }
  }

  private async followReconnect(url: string) {
    const old = this.ws
    try {
      const ws = await this.openSocket(url)
      if (this.closing || this.ws !== old) {
        ws.close()
        return
      }
      this.ws = ws
      this.armKeepalive()
      old?.close()
    } catch (e) {
      console.warn("Twitch session reconnect failed", e)
      old?.close()
    }
  }

  private onMessage(ws: WebSocket, ev: MessageEvent, onWelcome?: () => void) {
    const json =
      typeof ev.data === "string"
        ? (JSON.parse(ev.data) as { metadata: { message_type: MessageMetadata["message_type"] } })
        : undefined

    if (!json) {
      console.warn("Unknown message", ev.data)
      return
    }

    switch (json.metadata.message_type) {
      case "session_welcome": {
        const msg = json as WelcomeMessage
        this.session = msg.payload.session
        onWelcome?.()
        break
      }
      case "session_reconnect": {
        const msg = json as ReconnectMessage
        const url = msg.payload.session.reconnect_url
        if (url && ws === this.ws) this.followReconnect(url)
        break
      }
      case "notification": {
        if (ws !== this.ws) break
        this.onNotification(json as NotificationMessage)
        break
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
        const chatEvent = notification.payload.event as ChatNotificationEvent
        this.emit("chat", {
          feed: "twitch",
          created_at: Math.floor(new Date(notification.metadata.message_timestamp).getTime() / 1000),
          id: chatEvent.message_id,
          internal: chatEvent,
        })
        break
      }
    }
  }

  async validateToken() {
    if (!this.bearer) {
      throw new Error("Cant validate token without bearer token")
    }

    const rsp = await fetch("https://id.twitch.tv/oauth2/validate", {
      headers: {
        authorization: `OAuth ${this.bearer}`,
      },
    })
    const validation = await rsp.json()
    return validation as TokenValidationResponse
  }

  async subscribeMyChat() {
    if (!this.token?.user_id) {
      throw new Error("Token not found, cant subscribe to chat")
    }
    await this.subscribeChat(this.token.user_id)
  }

  async subscribeChat(user_id: string) {
    if (!this.session?.id) {
      throw new Error("Cant subscribe with no websocket connection")
    }
    if (!this.bearer) {
      throw new Error("Cant subscribe without bearer token")
    }

    const payload = {
      type: SubscriptionType.ChannelChatMessage,
      version: "1",
      condition: {
        broadcaster_user_id: user_id,
        user_id: user_id,
      },
      transport: {
        method: "websocket",
        session_id: this.session.id,
      },
    } satisfies SubscriptionRequest
    const rsp = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "Client-Id": this.clientId,
        authorization: `Bearer ${this.bearer}`,
      },
      body: JSON.stringify(payload),
    })

    const sub = (await rsp.json()) as ApiResponse<SubscriptionPayload>
    const subInfo = sub.data[0]
    this.subscriptions.set(subInfo.id, subInfo)
  }

  async unsubscribeAll() {
    for (const sub of [...this.subscriptions.keys()]) {
      await this.deleteSubscription(sub)
      this.subscriptions.delete(sub)
    }
  }

  async deleteSubscription(id: string) {
    if (!this.bearer) {
      throw new Error("Cant delete sub without bearer token")
    }
    await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${id}`, {
      method: "DELETE",
      headers: {
        "Client-Id": this.clientId,
        authorization: `Bearer ${this.bearer}`,
      },
    })
  }

  async getChannelBadges(channel_id: string) {
    if (!this.bearer) {
      throw new Error("Cant subscribe without bearer token")
    }
    const rsp = await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${channel_id}`, {
      headers: {
        "Client-Id": this.clientId,
        authorization: `Bearer ${this.bearer}`,
      },
    })

    const data = await rsp.json()
    return (data as { data: Array<BadgeSet> }).data
  }

  async getGlobalBadges() {
    if (!this.bearer) {
      throw new Error("Cant subscribe without bearer token")
    }
    const rsp = await fetch("https://api.twitch.tv/helix/chat/badges/global", {
      headers: {
        "Client-Id": this.clientId,
        authorization: `Bearer ${this.bearer}`,
      },
    })

    const data = await rsp.json()
    return (data as { data: Array<BadgeSet> }).data
  }

  /** Gracefully close the connection. */
  async disconnect() {
    this.closing = true
    clearTimeout(this.retryTimer)
    clearTimeout(this.keepaliveTimer)
    const ws = this.ws
    this.ws = undefined
    try {
      await this.unsubscribeAll()
    } finally {
      ws?.close()
    }
  }
}

export enum SubscriptionType {
  ChannelChatMessage = "channel.chat.message",
}

export interface TokenValidationResponse {
  client_id: string
  expires_in: number
  /**
   * Username of the login
   */
  login?: string
  scopes: Array<string>
  /**
   * Twitch user id
   */
  user_id: string
}
export interface SubscriptionRequest {
  type: SubscriptionType
  version: string
  condition: object
  transport: TransportInfo
}
export interface ApiResponse<T> {
  data: Array<T>
  total: number
  total_cost: number
  max_total_cost: number
}

export interface TransportInfo {
  method: "webhook" | "websocket" | "conduit"
  callback?: string
  secret?: string
  /**
   * WebSocket session_id
   */
  session_id?: string
  /**
   * Time when websocket was connected
   */
  connected_at?: string
  conduit_id?: string
}

export interface MessageMetadata {
  message_id: string
  message_type: "session_welcome" | "session_keepalive" | "session_reconnect" | "notification" | "revocation"
  message_timestamp: string
}

export type SubscriptionMetadata = MessageMetadata & {
  subscription_type: string
  subscription_version: string
}

export interface SesssionInfo {
  id: string
  status: string
  keepalive_timeout_seconds: number
  reconnect_url?: string
  connected_at: string
}

export interface SubscriptionPayload {
  id: string
  status: "enabled" | "webhook_callback_verification_pending"
  type: SubscriptionType
  version: string
  cost: number
  condition: object
  transport: TransportInfo
  created_at: string
}

export enum ChatMessageType {
  Text = "text",
  ChannelPointsHightlighted = "channel_points_highlighted",
  ChannelPointsSubOnly = "channel_points_sub_only",
  UserIntro = "user_intro",
  PowerUpsMessageEffect = "power_ups_message_effect",
  PowerUpsGigantifiedEmote = "power_ups_gigantified_emote",
}

export interface ChatNotificationEvent {
  message_id: string
  chatter_user_name: string
  message: {
    text: string
    fragments: Array<{
      type: "text" | "cheermote" | "emote" | "mention"
      text: string
      cheermote?: object
      emote?: object
      mention?: object
    }>
  }
  message_type: ChatMessageType
  color?: string
  badges: Array<ChatBadge>
}

export interface ChatBadge {
  set_id: string
  id: string
  info: string
}

export interface BadgeSet {
  set_id: string
  versions: Array<{
    id: string
    image_url_1x: string
    image_url_2x: string
    image_url_4x: string
    title: string
    description: string
    click_action?: string
    click_url?: string
  }>
}

export interface MessageTemplate<M extends MessageMetadata, P> {
  metadata: M
  payload: P
}

export type WelcomeMessage = MessageTemplate<MessageMetadata, { session: SesssionInfo }>
export type NotificationMessage = MessageTemplate<
  SubscriptionMetadata,
  { subscription: SubscriptionPayload; event?: object }
>
export type ReconnectMessage = MessageTemplate<MessageMetadata, { session: SesssionInfo }>
export type RevocationMessage = MessageTemplate<SubscriptionMetadata, { subscription: SubscriptionPayload }>
