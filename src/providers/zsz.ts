import { base64 } from "@scure/base";
import {
  StreamProvider,
  StreamProviderEndpoint,
  StreamProviderInfo,
  StreamProviderStreamInfo,
  StreamProviders,
} from ".";
import { EventKind, EventPublisher, NostrEvent, SystemInterface } from "@snort/system";
import { Login } from "@/login";
import { getPublisher } from "@/login";
import { extractStreamInfo } from "@/utils";
import { appendDedupe, unixNow } from "@snort/shared";
import { TimeSync } from "@/time-sync";

export class NostrStreamProvider implements StreamProvider {
  #publisher?: EventPublisher;
  #wsConnection?: WebSocket;
  #metricsCallbacks = new Map<string, (metrics: MetricsMessage) => void>();
  #pendingStreams = new Set<string>();
  #isAuthenticated = false;

  constructor(
    readonly name: string,
    readonly url: string,
    pub?: EventPublisher,
  ) {
    if (!url.endsWith("/")) {
      this.url = `${url}/`;
    }
    this.#publisher = pub;
  }

  get type() {
    return StreamProviders.NostrType;
  }

  async info() {
    const rsp = await this.#getJson<AccountResponse>("GET", "account");
    return {
      type: StreamProviders.NostrType,
      name: this.name,
      balance: rsp.balance,
      tosAccepted: rsp.tos?.accepted,
      tosLink: rsp.tos?.link,
      endpoints: rsp.endpoints.map(a => {
        return {
          name: a.name,
          url: a.url,
          key: a.key,
          rate: a.cost.rate,
          unit: a.cost.unit,
          capabilities: a.capabilities,
        } as StreamProviderEndpoint;
      }),
      forwards: rsp.forwards,
      streamInfo: rsp.details,
    } as StreamProviderInfo;
  }

  createConfig() {
    return {
      type: StreamProviders.NostrType,
      url: this.url,
    };
  }

  async updateStreamInfo(_: SystemInterface, ev: NostrEvent): Promise<void> {
    const { title, summary, image, tags, contentWarning, goal, gameId, id } = extractStreamInfo(ev);
    const props = {
      id,
      title,
      summary,
      image,
      tags: appendDedupe(tags, gameId ? [gameId] : undefined),
      content_warning: contentWarning,
      goal,
    };
    await this.updateStream(props);
  }

  async updateStream(props: {
    id: string;
    title?: string;
    summary?: string;
    image?: string;
    tags?: Array<string>;
    content_warning?: string;
    goal?: string;
  }): Promise<void> {
    await this.#getJson("PATCH", "event", props);

    // also update the default stream event details
    if (props.id) {
      delete props["id"];
      await this.#getJson("PATCH", "event", props);
    }
  }

  async topup(amount: number): Promise<string> {
    const rsp = await this.#getJson<TopUpResponse>("GET", `topup?amount=${amount}`);
    return rsp.pr;
  }

  async withdraw(invoice: string) {
    return await this.#getJson<{ fee: number; preimage: string; error?: string }>(
      "POST",
      `withdraw?invoice=${invoice}`,
    );
  }

  async acceptTos(): Promise<void> {
    await this.#getJson("PATCH", "account", {
      accept_tos: true,
    });
  }

  async addForward(name: string, target: string): Promise<void> {
    await this.#getJson("POST", "account/forward", {
      name,
      target,
    });
  }

  async removeForward(id: string): Promise<void> {
    await this.#getJson("DELETE", `account/forward/${id}`);
  }

  async prepareClip(id: string) {
    return await this.#getJson<{ id: string; length: number }>("GET", `clip/${id}`);
  }

  async createClip(id: string, clipId: string, start: number, length: number) {
    return await this.#getJson<{ url: string }>("POST", `clip/${id}/${clipId}?start=${start}&length=${length}`);
  }

  async getNotificationsInfo() {
    return await this.#getJson<{ publicKey: string }>("GET", "notifications/info");
  }

  async subscribeNotifications(req: { endpoint: string; key: string; auth: string; scope: string }) {
    return await this.#getJson<{ id: string }>("POST", "notifications/register", req);
  }

  async listStreamerSubscriptions(auth: string) {
    return await this.#getJson<Array<string>>("GET", `notifications?auth=${auth}`);
  }

  async addStreamerSubscription(pubkey: string) {
    return await this.#getJson("PATCH", `notifications?pubkey=${pubkey}`);
  }

  async removeStreamerSubscription(pubkey: string) {
    return await this.#getJson("DELETE", `notifications?pubkey=${pubkey}`);
  }

  getTempClipUrl(id: string, clipId: string) {
    return `${this.url}clip/${id}/${clipId}`;
  }

  async history(page = 0, pageSize = 20) {
    return await this.#getJson<BalanceHistoryResult>("GET", `history?page=${page}&pageSize=${pageSize}`);
  }

  async streamKeys(page = 0, pageSize = 20) {
    return await this.#getJson<StreamKeysResult | Array<StreamKeyItem>>(
      "GET",
      `keys?page=${page}&pageSize=${pageSize}`,
    );
  }

  async createStreamKey(expires?: undefined) {
    return await this.#getJson<{ key: string; event: NostrEvent }>("POST", "keys", {
      event: { title: "New stream key, who dis" },
      expires,
    });
  }

  async connectWebSocket(): Promise<void> {
    if (this.#wsConnection && this.#wsConnection.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const wsUrl = this.url.replace(/^https?:/, 'wss:').replace(/\/$/, '') + '/ws';
    this.#wsConnection = new WebSocket(wsUrl);

    this.#wsConnection.onopen = async () => {
      console.log('Provider WebSocket connected');

      // Send NIP-98 authentication using existing auth flow
      try {
        const pub = this.#getPublisher();
        if (pub) {
          const token = await pub.generic(eb => {
            return eb
              .kind(EventKind.HttpAuthentication)
              .content("")
              .tag(["u", wsUrl])
              .tag(["method", "GET"])
              .createdAt(unixNow() + Math.floor(TimeSync / 1000));
          });

          const authMessage = {
            type: 'Auth',
            data: { token: base64.encode(new TextEncoder().encode(JSON.stringify(token))) }
          };
          this.#wsConnection?.send(JSON.stringify(authMessage));
        }
      } catch (error) {
        console.error('Failed to authenticate WebSocket:', error);
      }
    };

    this.#wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle different message types based on admin API
        switch (data.type) {
          case 'AuthResponse':
            console.log('WebSocket authenticated, subscribing to streams');
            this.#isAuthenticated = true;
            // After successful auth, subscribe to any pending streams
            this.#subscribeToPendingStreams();
            // Notify callbacks about auth success
            this.#metricsCallbacks.forEach((callback) => {
              callback(data);
            });
            break;
          case 'StreamMetrics':
            // Notify all registered callbacks
            this.#metricsCallbacks.forEach((callback) => {
              callback(data);
            });
            break;
          case 'Error':
            console.error('WebSocket error:', data.error);
            break;
          default:
            // Handle any other message types
            this.#metricsCallbacks.forEach((callback) => {
              callback(data);
            });
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.#wsConnection.onclose = (event) => {
      console.log('Provider WebSocket disconnected');
      // Auto-reconnect after 5 seconds if not a manual close
      if (event.code !== 1000) {
        setTimeout(() => {
          this.connectWebSocket();
        }, 5000);
      }
    };

    this.#wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  subscribeToMetrics(streamId: string, callback: (metrics: MetricsMessage) => void): void {
    const subscriptionKey = `metrics_${streamId}`;
    this.#metricsCallbacks.set(subscriptionKey, callback);

    // Connect if not already connected
    this.connectWebSocket().then(() => {
      // If authenticated, subscribe immediately, otherwise queue for later
      if (this.#isAuthenticated && this.#wsConnection && this.#wsConnection.readyState === WebSocket.OPEN) {
        this.#sendSubscription(streamId);
      } else {
        this.#pendingStreams.add(streamId);
      }
    });
  }

  unsubscribeFromMetrics(streamId: string): void {
    const subscriptionKey = `metrics_${streamId}`;
    this.#metricsCallbacks.delete(subscriptionKey);

    // If no more callbacks, we could close the connection
    if (this.#metricsCallbacks.size === 0 && this.#wsConnection) {
      this.#wsConnection.close();
    }
  }

  closeWebSocket(): void {
    if (this.#wsConnection) {
      this.#wsConnection.close();
      this.#wsConnection = undefined;
    }
    this.#metricsCallbacks.clear();
    this.#pendingStreams.clear();
    this.#isAuthenticated = false;
  }

  #subscribeToPendingStreams(): void {
    this.#pendingStreams.forEach(streamId => {
      this.#sendSubscription(streamId);
    });
    this.#pendingStreams.clear();
  }

  #sendSubscription(streamId: string): void {
    if (this.#wsConnection && this.#wsConnection.readyState === WebSocket.OPEN) {
      this.#wsConnection.send(JSON.stringify({
        type: 'SubscribeStream',
        data: {
          stream_id: streamId
        }
      }));
    }
  }

  #getPublisher(): EventPublisher | undefined {
    if (this.#publisher) {
      return this.#publisher;
    } else {
      const login = Login.snapshot();
      return login && getPublisher(login);
    }
  }

  async #getJson<T>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T> {
    const pub = (() => {
      if (this.#publisher) {
        return this.#publisher;
      } else {
        const login = Login.snapshot();
        return login && getPublisher(login);
      }
    })();
    if (!pub) throw new Error("No signer");

    const u = `${this.url}${path}`;
    const token = await pub.generic(eb => {
      return eb
        .kind(EventKind.HttpAuthentication)
        .content("")
        .tag(["u", u])
        .tag(["method", method])
        .createdAt(unixNow() + Math.floor(TimeSync / 1000));
    });
    const rsp = await fetch(u, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "content-type": "application/json",
        authorization: `Nostr ${base64.encode(new TextEncoder().encode(JSON.stringify(token)))}`,
      },
    });
    const json = await rsp.text();
    if (!rsp.ok) {
      throw new Error(json);
    }
    return json.length > 0 ? (JSON.parse(json) as T) : ({} as T);
  }
}

interface AccountResponse {
  balance: number;
  endpoints: Array<IngestEndpoint>;
  tos?: {
    accepted: boolean;
    link: string;
  };
  forwards: Array<ForwardDest>;
  details?: StreamProviderStreamInfo;
}

interface ForwardDest {
  id: string;
  name: string;
}

interface IngestEndpoint {
  name: string;
  url: string;
  key: string;
  cost: {
    unit: string;
    rate: number;
  };
  capabilities: Array<string>;
}

interface TopUpResponse {
  pr: string;
}

export interface BalanceHistoryResult {
  items: Array<{
    created: number;
    type: number;
    amount: number;
    desc?: string;
  }>;
  page: number;
  pageSize: number;
}

export interface StreamKeyItem {
  id: string;
  created: number;
  key: string;
  expires?: number;
  stream?: NostrEvent;
}

export interface StreamKeysResult {
  items: Array<StreamKeyItem>;
  page: number;
  pageSize: number;
}

export interface MetricsMessage {
  type: 'StreamMetrics' | 'AuthResponse' | 'Error' | string;
  data?: {
    stream_id?: string;
    pubkey?: string;
    user_id?: number;
    started_at?: string;
    last_segment_time?: string;
    node_name?: string;
    viewers?: number;
    average_fps?: number;
    target_fps?: number;
    frame_count?: number;
    endpoint_name?: string;
    input_resolution?: string;
    ip_address?: string;
    ingress_name?: string;
    endpoint_stats?: {
      [key: string]: {
        name: string;
        bitrate: number;
      };
    };
    // Other possible metrics
    [key: string]: unknown;
  };
  error?: string;
}
