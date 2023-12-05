import { ExternalStore } from "@snort/shared";

export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      registerValidSW("/service-worker.js");
    });
  }
}

class BoolStore extends ExternalStore<boolean> {
  #value = false;

  set value(v: boolean) {
    this.#value = v;
    this.notifyChange();
  }

  get value() {
    return this.#value;
  }

  takeSnapshot(): boolean {
    return this.#value;
  }
}

export const NewVersion = new BoolStore();

async function registerValidSW(swUrl: string) {
  try {
    const registration = await navigator.serviceWorker.register(swUrl);
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (installingWorker === null) {
        return;
      }
      installingWorker.onstatechange = () => {
        if (installingWorker.state === "installed") {
          if (navigator.serviceWorker.controller) {
            console.log("Service worker updated, pending reload");
            NewVersion.value = true;
          } else {
            console.log("Content is cached for offline use.");
          }
        }
      };
    };
  } catch (e) {
    console.error("Error during service worker registration:", e);
  }
}
