import { ExternalStore } from "@snort/shared";

export interface LoginSession {
    pubkey: string
}

export class LoginStore extends ExternalStore<LoginSession | undefined> {
    #session?: LoginSession;

    constructor() {
        super();
        const json = window.localStorage.getItem("session");
        if (json) {
            this.#session = JSON.parse(json);
        }
    }

    loginWithPubkey(pk: string) {
        this.#session = {
            pubkey: pk
        };
        window.localStorage.setItem("session", JSON.stringify(this.#session));
        this.notifyChange();
    }

    takeSnapshot() {
        return this.#session ? { ...this.#session } : undefined;
    }
}