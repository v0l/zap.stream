import { N94_LIVE_STREAM, NIP5_DOMAIN, StreamState } from "@/const"
import type { NostrJson } from "@snort/shared"
import { type NostrEvent, NostrLink } from "@snort/system"
import { useEffect, useState } from "react"

const lookups = new Map<string, Promise<string | undefined>>()

export function fetchShortName(pubkey: string, domain: string, timeout = 2_000) {
  const key = `${pubkey}@${domain}`
  let lookup = lookups.get(key)
  if (!lookup) {
    lookup = fetch(`https://${domain}/.well-known/nostr.json?pubkey=${pubkey}`, {
      signal: AbortSignal.timeout(timeout),
    })
      .then(r => r.json() as Promise<NostrJson>)
      .then(j => Object.entries(j?.names ?? {}).find(([, pk]) => pk === pubkey)?.[0])
      .catch(() => {
        lookups.delete(key)
        return undefined
      })
    lookups.set(key, lookup)
  }
  return lookup
}

export function shortLinkFor(ev: NostrEvent, name: string | undefined) {
  if (!name) return
  const status = ev.tags.find(t => t[0] === "status")?.[1]
  if (status !== StreamState.Live && ev.kind !== N94_LIVE_STREAM) return
  return `/${name}`
}

export function useStreamHref(ev: NostrEvent, host: string) {
  const [name, setName] = useState<{ host: string; name?: string }>()

  useEffect(() => {
    let active = true
    fetchShortName(host, NIP5_DOMAIN).then(n => {
      if (active) setName({ host, name: n })
    })
    return () => {
      active = false
    }
  }, [host])

  return shortLinkFor(ev, name?.host === host ? name.name : undefined) ?? `/${NostrLink.fromEvent(ev).encode()}`
}
