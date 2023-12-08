import { base64 } from "@scure/base";
import {
  StreamProvider,
  StreamProviderEndpoint,
  StreamProviderInfo,
  StreamProviderStreamInfo,
  StreamProviders,
} from ".";
import { EventKind, EventPublisher, NostrEvent, SystemInterface } from "@snort/system";
import { Login, StreamState } from "@/index";
import { getPublisher } from "@/login";
import { extractStreamInfo } from "@/utils";

export class NostrStreamProvider implements StreamProvider {
  #publisher?: EventPublisher;

  constructor(readonly name: string, readonly url: string, pub?: EventPublisher) {
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
      streamInfo: rsp.event,
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
    const { title, summary, image, tags, contentWarning, goal } = extractStreamInfo(ev);
    await this.#getJson("PATCH", "event", {
      title,
      summary,
      image,
      tags,
      content_warning: contentWarning,
      goal,
    });
  }

  async topup(amount: number): Promise<string> {
    const rsp = await this.#getJson<TopUpResponse>("GET", `topup?amount=${amount}`);
    return rsp.pr;
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

  async createClip(id: string) {
    return await this.#getJson<{ url: string }>("POST", `clip/${id}`);
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
      return eb.kind(EventKind.HttpAuthentication).content("").tag(["u", u]).tag(["method", method]);
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
  event?: StreamProviderStreamInfo;
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
