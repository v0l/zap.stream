/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | PrecacheEntry)[];
};

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
