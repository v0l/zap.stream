import { EventExt, EventKind, RequestBuilder, type NostrEvent, type SystemInterface, type TaggedNostrEvent } from "@snort/system"
import type { EventSigner } from "@snort/system"
import { unixNow } from "@snort/shared"

export function latestEvent<T extends { created_at: number }>(events: Array<T>) {
  return events.reduce<T | undefined>((best, ev) => (!best || ev.created_at > best.created_at ? ev : best), undefined)
}

export function applyFollowChange(tags: Array<Array<string>>, pubkey: string, follow: boolean) {
  const rest = tags.filter(t => !(t[0] === "p" && t[1] === pubkey))
  return follow ? [...rest, ["p", pubkey]] : rest
}

export async function fetchLatestContacts(system: Pick<SystemInterface, "Fetch">, author: string) {
  const rb = new RequestBuilder(`contacts:${author}`)
  rb.withFilter().kinds([EventKind.ContactList]).authors([author])
  const events: Array<TaggedNostrEvent> = await system.Fetch(rb)
  return latestEvent(events.filter(e => e.kind === EventKind.ContactList && e.pubkey === author))
}

export async function publishFollowChange(opts: {
  system: Pick<SystemInterface, "Fetch" | "BroadcastEvent">
  signer: EventSigner
  pubkey: string
  target: string
  follow: boolean
  fallbackFollows?: Array<string>
}) {
  const latest = await fetchLatestContacts(opts.system, opts.pubkey)
  const baseTags = latest?.tags ?? (opts.fallbackFollows ?? []).map(p => ["p", p])
  const created_at = Math.max(unixNow(), (latest?.created_at ?? 0) + 1)
  const unsigned = {
    id: "",
    sig: "",
    pubkey: opts.pubkey,
    kind: EventKind.ContactList,
    created_at,
    content: latest?.content ?? "",
    tags: applyFollowChange(baseTags, opts.target, opts.follow),
  } as NostrEvent
  unsigned.id = EventExt.createId(unsigned)
  const signed = await opts.signer.sign(unsigned)
  await opts.system.BroadcastEvent(signed)
  return signed
}
