import { StreamState } from "index";
import { NostrEvent } from "@snort/system";
import { ExternalStore } from "@snort/shared";
import { Nip103StreamProvider } from "./zsz";
import { ManualProvider } from "./manual";
import { OwncastProvider } from "./owncast";

export interface StreamProvider {
  get name(): string;
  get type(): StreamProviders;

  /**
   * Get general info about connected provider to test everything is working
   */
  info(): Promise<StreamProviderInfo>;

  /**
   * Create a config object to save in localStorage
   */
  createConfig(): unknown & { type: StreamProviders };

  /**
   * Update stream info event
   */
  updateStreamInfo(ev: NostrEvent): Promise<void>;

  /**
   * Top-up balance with provider
   */
  topup(amount: number): Promise<string>;

  /**
   * Accept TOS of the streaming provider
   */
  acceptTos(): Promise<void>;
}

export enum StreamProviders {
  Manual = "manual",
  Owncast = "owncast",
  Cloudflare = "cloudflare",
  NostrType = "nostr",
}

export interface StreamProviderInfo {
  name: string;
  summary?: string;
  version?: string;
  state: StreamState;
  viewers?: number;
  publishedEvent?: NostrEvent;
  streamInfo?: StreamProviderStreamInfo;
  balance?: number;
  endpoints: Array<StreamProviderEndpoint>;
  tosAccepted?: boolean;
  tosLink?: string;
}

export interface StreamProviderEndpoint {
  name: string;
  url: string;
  key: string;
  rate?: number;
  unit?: string;
  capabilities?: Array<string>;
}

export interface StreamProviderStreamInfo {
  title: string;
  summary: string;
  image: string;
  tags: Array<string>;
  content_warning: string;
}

export const DefaultProvider = new Nip103StreamProvider("zap.stream", "https://api.zap.stream/api/nostr/");

export class ProviderStore extends ExternalStore<Array<StreamProvider>> {
  #providers: Array<StreamProvider> = [];

  constructor() {
    super();
    const cache = window.localStorage.getItem("providers");
    if (cache) {
      const cached: Array<{ type: StreamProviders } & Record<string, unknown>> = JSON.parse(cache);
      for (const c of cached) {
        switch (c.type) {
          case StreamProviders.Manual: {
            this.#providers.push(new ManualProvider());
            break;
          }
          case StreamProviders.NostrType: {
            this.#providers.push(new Nip103StreamProvider(new URL(c.url as string).host, c.url as string));
            break;
          }
          case StreamProviders.Owncast: {
            this.#providers.push(new OwncastProvider(c.url as string, c.token as string));
            break;
          }
        }
      }
    }
  }

  add(p: StreamProvider) {
    this.#providers.push(p);
    this.#save();
    this.notifyChange();
  }

  takeSnapshot() {
    return [DefaultProvider, new ManualProvider(), ...this.#providers];
  }

  #save() {
    const cfg = this.#providers.map(a => a.createConfig());
    window.localStorage.setItem("providers", JSON.stringify(cfg));
  }
}

export const StreamProviderStore = new ProviderStore();
