/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | PrecacheEntry)[];
};

import { hexToBech32 } from "@snort/shared";
import { clientsClaim } from "workbox-core";
import { PrecacheEntry, precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);
clientsClaim();

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
self.addEventListener("install", event => {
  // delete all cache on install
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.debug("Deleting cache: ", cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  // always skip waiting
  self.skipWaiting();
});

const enum NotificationType {
  StreamStarted = 1,
}

interface PushNotification {
  type: NotificationType;
  pubkey: string;
  name?: string;
  avatar?: string;
}

self.addEventListener("notificationclick", event => {
  const ev = JSON.parse(event.notification.data) as PushNotification;

  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window" });
      const url = () => {
        return `/${hexToBech32("npub", ev.pubkey)}`;
      };
      for (const client of windows) {
        if (client.url === url() && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url());
    })()
  );
});

self.addEventListener("push", async e => {
  console.debug(e);
  const data = e.data?.json() as PushNotification | undefined;
  if (!data) return;

  const icon = data.avatar ?? `${location.protocol}//${location.hostname}/logo_256.png`;
  if (data?.type == NotificationType.StreamStarted) {
    const ret = {
      icon,
      timestamp: new Date().getTime(),
      data: JSON.stringify(data),
    };
    console.debug(ret);
    await self.registration.showNotification(
      `${data.name ?? hexToBech32("npub", data.pubkey).slice(0, 12)} went live`,
      ret
    );
  }
});
