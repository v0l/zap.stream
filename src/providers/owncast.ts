import { StreamState } from "index";
import { StreamProvider, StreamProviderInfo, StreamProviders } from "providers";

export class OwncastProvider implements StreamProvider {
    #url: string
    #token: string

    constructor(url: string, token: string) {
        this.#url = url;
        this.#token = token;
    }

    get name() {
        return new URL(this.#url).host
    }

    get type() {
        return StreamProviders.Owncast
    }

    createConfig() {
        return {
            type: StreamProviders.Owncast,
            url: this.#url,
            token: this.#token
        }
    }

    updateStreamInfo(): Promise<void> {
        return Promise.resolve();
    }

    async info() {
        const info = await this.#getJson<ConfigResponse>("GET", "/api/config");
        const status = await this.#getJson<StatusResponse>("GET", "/api/status");
        return {
            type: StreamProviders.Owncast,
            name: info.name,
            summary: info.summary,
            version: info.version,
            state: status.online ? StreamState.Live : StreamState.Ended,
            viewers: status.viewerCount
        } as StreamProviderInfo
    }

    topup(): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async #getJson<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
        const rsp = await fetch(`${this.#url}${path}`, {
            method: method,
            body: body ? JSON.stringify(body) : undefined,
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${this.#token}`
            },
        });
        const json = await rsp.text();
        if (!rsp.ok) {
            throw new Error(json);
        }
        return JSON.parse(json) as T;
    }

}

interface ConfigResponse {
    name?: string,
    summary?: string,
    logo?: string,
    tags?: Array<string>,
    version?: string
}

interface StatusResponse {
    lastConnectTime?: string
    lastDisconnectTime?: string
    online: boolean
    overallMaxViewerCount: number
    sessionMaxViewerCount: number
    viewerCount: number
}