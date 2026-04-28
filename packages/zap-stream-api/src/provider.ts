import { base64 } from "@scure/base";
import type { Signer, NostrEvent } from "./types";
import { appendDedupe, unixNow, buildUnsignedEvent } from "./types";
import { HTTP_AUTH_KIND } from "./constants";

/**
 * Time synchronization offset with the zap.stream API server.
 *
 * Consumers should call `syncClock()` once at startup to calibrate,
 * then use `TimeSync.offset` when constructing auth events.
 */
export class TimeSync {
  #offset = 0;

  /** Current offset in milliseconds (server_time - local_time). */
  get offset(): number {
    return this.#offset;
  }

  /**
   * Synchronize the local clock with the zap.stream API server.
   * Sets the internal offset used for auth event timestamps.
   */
  async syncClock(apiUrl = "https://api-core.zap.stream/api/v1"): Promise<void> {
    try {
      const now = Date.now();
      const req = await fetch(`${apiUrl}/time`, {
        signal: AbortSignal.timeout(1000),
      });
      const nowAtServer = (await req.json()).time as number;
      this.#offset = nowAtServer - now;
    } catch {
      // ignore — offset stays at 0
    }
  }
}

/** Shared default TimeSync instance. */
export const timeSync = new TimeSync();

export class NostrStreamProvider {
  #signer?: Signer;
  #wsConnection?: WebSocket;
  #metricsCallbacks = new Map<string, (metrics: MetricsMessage) => void>();
  #pendingStreams = new Set<string>();
  #isAuthenticated = false;
  #timeSync: TimeSync;

  constructor(
    readonly name: string,
    readonly url: string,
    signer?: Signer,
    ts?: TimeSync,
  ) {
    if (!url.endsWith("/")) {
      this.url = `${url}/`;
    }
    this.#signer = signer;
    this.#timeSync = ts ?? timeSync;
  }

  /**
   * Update the Signer used for signing requests.
   * Useful when the user logs in/out without recreating the provider.
   */
  setSigner(signer: Signer | undefined): void {
    this.#signer = signer;
  }

  async info() {
    const rsp = await this.#getJson<AccountResponse>("GET", "account");
    return rsp;
  }

  /**
   * Update stream details from a NostrEvent by extracting the relevant fields.
   * If you already have the fields, use `updateStream()` directly.
   */
  async updateStreamFromEvent(ev: NostrEvent, extractFn: (ev: NostrEvent) => StreamInfo): Promise<void> {
    const { title, summary, image, tags, contentWarning, goal, gameId, id } = extractFn(ev);
    const props: StreamDetails = {
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

  async updateStream(props: StreamDetails): Promise<void> {
    await this.#getJson("PATCH", "event", props);

    // also update the default stream event details
    if (props.id) {
      const { id: _, ...rest } = props;
      await this.#getJson("PATCH", "event", rest);
    }
  }

  async topup(amount: number): Promise<string> {
    const rsp = await this.#getJson<TopUpResponse>("GET", `topup?amount=${amount}`);
    return rsp.pr;
  }

  async withdraw(invoice: string) {
    return await this.#getJson<{ fee: number; preimage: string; error?: string }>("POST", `withdraw?invoice=${invoice}`);
  }

  async acceptTos(): Promise<void> {
    await this.#getJson("PATCH", "account", {
      accept_tos: true,
    });
  }

  async configureNwc(nwcUri: string): Promise<void> {
    await this.#getJson("PATCH", "account", {
      nwc: nwcUri,
    });
  }

  async removeNwc(): Promise<void> {
    await this.#getJson("PATCH", "account", {
      remove_nwc: true,
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
    return await this.#getJson<StreamKeysResult | Array<StreamKeyItem>>("GET", `keys?page=${page}&pageSize=${pageSize}`);
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

    const wsUrl = `${this.url.replace(/^https?:/, "wss:").replace(/\/$/, "")}/ws`;
    this.#wsConnection = new WebSocket(wsUrl);

    this.#wsConnection.onopen = async () => {
      try {
        const signer = this.#signer;
        if (signer) {
          const pubkey = await signer.getPubKey();
          const unsigned = buildUnsignedEvent(
            pubkey,
            HTTP_AUTH_KIND,
            [["u", wsUrl], ["method", "GET"]],
            "",
            unixNow() + Math.floor(this.#timeSync.offset / 1000),
          );
          const token = await signer.sign(unsigned);

          const authMessage = {
            type: "Auth",
            data: { token: base64.encode(new TextEncoder().encode(JSON.stringify(token))) },
          };
          this.#wsConnection?.send(JSON.stringify(authMessage));
        }
      } catch (error) {
        console.error("Failed to authenticate WebSocket:", error);
      }
    };

    this.#wsConnection.onmessage = event => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "AuthResponse":
            this.#isAuthenticated = true;
            this.#subscribeToPendingStreams();
            this.#metricsCallbacks.forEach(callback => {
              callback(data);
            });
            break;
          case "StreamMetrics":
            this.#metricsCallbacks.forEach(callback => {
              callback(data);
            });
            break;
          case "Error":
            console.error("WebSocket error:", data.error);
            break;
          default:
            this.#metricsCallbacks.forEach(callback => {
              callback(data);
            });
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.#wsConnection.onclose = event => {
      if (event.code !== 1000) {
        setTimeout(() => {
          this.connectWebSocket();
        }, 5000);
      }
    };

    this.#wsConnection.onerror = error => {
      console.error("WebSocket error:", error);
    };
  }

  subscribeToMetrics(streamId: string, callback: (metrics: MetricsMessage) => void): void {
    const subscriptionKey = `metrics_${streamId}`;
    this.#metricsCallbacks.set(subscriptionKey, callback);

    this.connectWebSocket().then(() => {
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
      this.#wsConnection.send(
        JSON.stringify({
          type: "SubscribeStream",
          data: {
            stream_id: streamId,
          },
        }),
      );
    }
  }

  async #getJson<T>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T> {
    const signer = this.#signer;
    if (!signer) throw new Error("No signer — provide a Signer via the constructor or setSigner()");

    const u = `${this.url}${path}`;
    const pubkey = await signer.getPubKey();
    const unsigned = buildUnsignedEvent(
      pubkey,
      HTTP_AUTH_KIND,
      [["u", u], ["method", method]],
      "",
      unixNow() + Math.floor(this.#timeSync.offset / 1000),
    );
    const token = await signer.sign(unsigned);

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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamDetails {
  id?: string;
  title?: string;
  summary?: string;
  image?: string;
  tags?: Array<string>;
  content_warning?: string;
  goal?: string;
}

export interface AccountResponse {
  balance: number;
  endpoints: Array<IngestEndpoint>;
  tos?: {
    accepted: boolean;
    link: string;
  };
  forwards: Array<ForwardDest>;
  details?: StreamDetails;
  has_nwc?: boolean;
}

export interface ForwardDest {
  id: string;
  name: string;
}

export interface IngestEndpoint {
  name: string;
  url: string;
  key: string;
  cost: {
    unit: string;
    rate: number;
  };
  capabilities: Array<string>;
}

export interface TopUpResponse {
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
  type: "StreamMetrics" | "AuthResponse" | "Error" | string;
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
  };
  error?: string;
}

/**
 * Extracted stream info from a Nostr live-stream event.
 * Used with `NostrStreamProvider.updateStreamFromEvent()`.
 */
export interface StreamInfo {
  id?: string;
  title?: string;
  summary?: string;
  image?: string;
  thumbnail?: string;
  status?: string;
  stream?: string;
  recording?: string;
  contentWarning?: string;
  tags: Array<string>;
  goal?: string;
  participants?: string;
  starts?: string;
  ends?: string;
  service?: string;
  host?: string;
  gameId?: string;
  streams: Array<string>;
}
