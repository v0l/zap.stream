import { ExternalStore } from "@snort/shared";

class Store extends ExternalStore<boolean> {
    #value: boolean;

    constructor() {
        super();
        this.#value = Boolean(window.localStorage.getItem("accepted-content-warning"));
    }

    setValue(v: boolean) {
        this.#value = v;
        window.localStorage.setItem("accepted-content-warning", String(v));
        this.notifyChange();
    }

    takeSnapshot(): boolean {
        return this.#value;
    }

}

export const NSFWStore = new Store();