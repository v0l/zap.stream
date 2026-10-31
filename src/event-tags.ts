import type { NostrEvent } from "@snort/system"
import { P_TAG_HOST_WHITELIST } from "@/const"

export function findTag(e: NostrEvent | undefined, tag: string) {
  const maybeTag = e?.tags.find(evTag => {
    return evTag[0] === tag
  })
  return maybeTag?.[1]
}

export function getHost(ev: NostrEvent) {
  const isHostTagAllowed = ev.pubkey && P_TAG_HOST_WHITELIST.includes(ev.pubkey)
  const ret =
    ev.tags.find(a => a[0] === "p" && a.length > 3 && a[3].toLowerCase() === "host" && isHostTagAllowed)?.[1] ??
    ev.pubkey
  if (!ret) {
    throw new Error("Invalid host")
  }
  return ret
}

export function getPlaceholder(id: string) {
  return `https://nostr-rs-api.v0l.io/avatar/robots/${id}.webp`
}
