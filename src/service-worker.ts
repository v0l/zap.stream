/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | PrecacheEntry)[]
}

import { hexToBech32 } from "@snort/shared"
import { clientsClaim } from "workbox-core"
import { type PrecacheEntry, cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching"

// Remove precaches from older workbox versions / naming schemes.
// NOTE: do NOT manually delete all caches on install - that races with
// precacheAndRoute() populating the new precache during the same install
// event and corrupts it. Workbox removes stale entries on activate.
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Activate new service worker immediately and take control of open pages.
// The client (virtual:pwa-register) reloads pages on controllerchange so
// old app code never runs against a new precache.
self.skipWaiting()
clientsClaim()

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

enum NotificationType {
  StreamStarted = 1,
}

interface PushNotification {
  type: NotificationType
  pubkey: string
  name?: string
  avatar?: string
}

self.addEventListener("notificationclick", event => {
  const ev = JSON.parse(event.notification.data) as PushNotification

  event.notification.close()
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window" })
      const url = () => {
        return `/${hexToBech32("npub", ev.pubkey)}`
      }
      for (const client of windows) {
        if (client.url === url() && "focus" in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url())
    })(),
  )
})

self.addEventListener("push", async e => {
  console.debug(e)
  const data = e.data?.json() as PushNotification | undefined
  if (!data) return

  const icon = data.avatar ?? `${location.protocol}//${location.hostname}/logo_256.png`
  if (data?.type === NotificationType.StreamStarted) {
    const ret = {
      icon,
      timestamp: Date.now(),
      data: JSON.stringify(data),
    }
    console.debug(ret)
    await self.registration.showNotification(
      `${data.name ?? hexToBech32("npub", data.pubkey).slice(0, 12)} went live`,
      ret,
    )
  }
})
