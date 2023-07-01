import { StreamState } from "index"

export interface StreamProvider {
    /**
     * Get general info about connected provider to test everything is working
     */
    info(): Promise<StreamProviderInfo>

    /**
     * Create a config object to save in localStorage
     */
    createConfig(): any & { type: StreamProviders }
}

export enum StreamProviders {
    Owncast = "owncast",
    Cloudflare = "cloudflare"
}

export interface StreamProviderInfo {
    name: string
    summary?: string
    version?: string
    state: StreamState
    viewers: number
}
