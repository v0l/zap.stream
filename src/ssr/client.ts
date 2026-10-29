import { mapEventToProfile, type RequestBuilder, type TaggedNostrEvent } from "@snort/system"

interface Payload {
  now: number
  origin: string
  queries: Record<string, Array<TaggedNostrEvent>>
  profiles: Record<string, TaggedNostrEvent>
}

let payload: Payload | undefined
let hydrating = false

export function loadHydration() {
  const el = document.getElementById("ssr-data")
  if (!el?.textContent) return false
  payload = JSON.parse(el.textContent) as Payload
  hydrating = true
  return true
}

export function finishHydration() {
  hydrating = false
}

export function isHydrating() {
  return hydrating
}

export function seed(rb: RequestBuilder) {
  const events = hydrating ? payload?.queries[rb.id] : undefined
  if (events?.length) rb.withOptions({ extraEvents: events })
}

export function seedProfiles(set: (p: NonNullable<ReturnType<typeof mapEventToProfile>>) => unknown) {
  for (const ev of Object.values(payload?.profiles ?? {})) {
    const profile = mapEventToProfile(ev)
    if (profile) set(profile)
  }
}
