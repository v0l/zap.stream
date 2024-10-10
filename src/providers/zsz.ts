import { base64 } from "@scure/base";
import { StreamProvider, StreamProviderEndpoint, StreamProviderInfo, StreamProviders } from ".";
import { EventKind, EventPublisher, NostrEvent, SystemInterface } from "@snort/system";
import { Login } from "@/login";
import { getPublisher } from "@/login";
import { extractStreamInfo } from "@/utils";
import { StreamState } from "@/const";
import { appendDedupe, unixNow } from "@snort/shared";
import { TimeSync } from "@/time-sync";

export class NostrStreamProvider implements StreamProvider {
  #publisher?: EventPublisher;

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
      state: StreamState.Planned,
      viewers: 0,
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
    await this.#getJson("PATCH", "event", {
      id,
      title,
      summary,
      image,
      tags: appendDedupe(tags, gameId ? [gameId] : undefined),
      content_warning: contentWarning,
      goal,
    });
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
    return await this.#getJson<StreamKeysResult>("GET", `keys?page=${page}&pageSize=${pageSize}`);
  }

  async createStreamKey(expires?: undefined) {
    return await this.#getJson<{ key: string; event: NostrEvent }>("POST", "keys", {
      event: { title: "New stream key, who dis" },
      expires,
    });
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
      return eb.kind(EventKind.HttpAuthentication)
        .content("")
        .tag(["u", u]).tag(["method", method])
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

export interface StreamKeysResult {
  items: Array<{
    id: string;
    created: number;
    key: string;
    expires?: number;
    stream?: NostrEvent;
  }>;
  page: number;
  pageSize: number;
}
