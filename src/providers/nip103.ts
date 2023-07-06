import { StreamProvider, StreamProviderInfo, StreamProviders } from ".";
import { EventPublisher, EventKind, NostrEvent } from "@snort/system";
import { findTag } from "utils";

export class Nip103StreamProvider implements StreamProvider {
    #url: string

    constructor(url: string) {
        this.#url = url;
    }

    get name() {
        return new URL(this.#url).host;
    }

    get type() {
        return StreamProviders.NostrType
    }

    async info() {
        const rsp = await this.#getJson<AccountResponse>("GET", "account");
        const title = findTag(rsp.event, "title");
        const state = findTag(rsp.event, "status");
        return {
            type: StreamProviders.NostrType,
            name: title ?? "",
            state: state,
            viewers: 0,
            ingressUrl: rsp.url,
            ingressKey: rsp.key,
            balance: rsp.quota.remaining,
            publishedEvent: rsp.event
        } as StreamProviderInfo
    }

    createConfig() {
        return {
            type: StreamProviders.NostrType,
            url: this.#url
        }
    }

    async updateStreamInfo(ev: NostrEvent): Promise<void> {
        const title = findTag(ev, "title");
        const summary = findTag(ev, "summary");
        const image = findTag(ev, "image");
        const tags = ev?.tags.filter(a => a[0] === "t").map(a => a[1]);
        await this.#getJson("PATCH", "event", {
            title, summary, image, tags
        });
    }

    async topup(amount: number): Promise<string> {
        const rsp = await this.#getJson<TopUpResponse>("GET", `topup?amount=${amount}`);
        return rsp.pr;
    }

    async #getJson<T>(method: "GET" | "POST" | "PATCH", path: string, body?: unknown): Promise<T> {
        const pub = await EventPublisher.nip7();
        if (!pub) throw new Error("No event publisher");

        const u = `${this.#url}${path}`;
        const token = await pub.generic(eb => {
            return eb.kind(EventKind.HttpAuthentication)
                .content("")
                .tag(["u", u])
                .tag(["method", method])
        });
        const rsp = await fetch(u, {
            method: method,
            body: body ? JSON.stringify(body) : undefined,
            headers: {
                "content-type": "application/json",
                "authorization": `Nostr ${btoa(JSON.stringify(token))}`
            },
        });
        const json = await rsp.text();
        if (!rsp.ok) {
            throw new Error(json);
        }
        return json.length > 0 ? JSON.parse(json) as T : {} as T;
    }
}

interface AccountResponse {
    url: string
    key: string
    event?: NostrEvent
    quota: {
        unit: string
        rate: number
        remaining: number
    }
}

interface TopUpResponse {
    pr: string
}