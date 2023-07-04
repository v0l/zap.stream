import { StreamState } from "index"
import { NostrEvent } from "@snort/system";
import { ExternalStore } from "@snort/shared";
import { Nip103StreamProvider } from "./nip103";
import { ManualProvider } from "./manual";
import { OwncastProvider } from "./owncast";


export interface StreamProvider {
    get name(): string
    get type(): StreamProviders

    /**
     * Get general info about connected provider to test everything is working
     */
    info(): Promise<StreamProviderInfo>

    /**
     * Create a config object to save in localStorage
     */
    createConfig(): any & { type: StreamProviders }

    /**
     * Update stream info event
     */
    updateStreamInfo(ev: NostrEvent): Promise<void>

    /**
     * Top-up balance with provider
     */
    topup(amount: number): Promise<string>
}

export enum StreamProviders {
    Manual = "manual",
    Owncast = "owncast",
    Cloudflare = "cloudflare",
    NostrType = "nostr"
}

export interface StreamProviderInfo {
    name: string
    summary?: string
    version?: string
    state: StreamState
    viewers?: number
    ingressUrl?: string
    ingressKey?: string
    balance?: number
    publishedEvent?: NostrEvent
}

export class ProviderStore extends ExternalStore<Array<StreamProvider>> {
    #providers: Array<StreamProvider> = []

    constructor() {
        super();
        const cache = window.localStorage.getItem("providers");
        if (cache) {
            const cached: Array<{ type: StreamProviders } & any> = JSON.parse(cache);
            for (const c of cached) {
                switch (c.type) {
                    case StreamProviders.Manual: {
                        this.#providers.push(new ManualProvider());
                        break;
                    }
                    case StreamProviders.NostrType: {
                        this.#providers.push(new Nip103StreamProvider(c.url));
                        break;
                    }
                    case StreamProviders.Owncast: {
                        this.#providers.push(new OwncastProvider(c.url, c.token));
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
        return [new Nip103StreamProvider("https://api.zap.stream/api/nostr/"), new ManualProvider(), ...this.#providers];
    }

    #save() {
        const cfg = this.#providers.map(a => a.createConfig());
        window.localStorage.setItem("providers", JSON.stringify(cfg));
    }
}

export const StreamProviderStore = new ProviderStore();