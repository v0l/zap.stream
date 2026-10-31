import { type NostrLink, RequestBuilder, type TaggedNostrEvent } from "@snort/system"
import { useRequestBuilder } from "@snort/system-react"
import { useMemo } from "react"

import { LIVE_STREAM_KINDS, StreamState } from "@/const"
import { findTag, getHost } from "@/event-tags"
import { NostrPrefix } from "@snort/shared"

export function useCurrentStreamFeed(link: NostrLink, leaveOpen = false, evPreload?: TaggedNostrEvent) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`current-event:${link.id}`)
    b.withOptions({
      leaveOpen,
    })
    if (link.type === NostrPrefix.PublicKey || link.type === NostrPrefix.Profile) {
      b.withFilter().authors([link.id]).kinds(LIVE_STREAM_KINDS).limit(10)
      b.withFilter().tag("p", [link.id]).kinds(LIVE_STREAM_KINDS).limit(10)
    } else {
      b.withFilter().link(link)
    }
    return b
  }, [link.id, leaveOpen])

  const q = useRequestBuilder(sub)

  return useMemo(() => pickCurrentStream(link, [...q, ...(evPreload ? [evPreload] : [])]), [q])
}

export function pickCurrentStream(link: NostrLink, events: Array<TaggedNostrEvent>) {
  const byPubkey = link.type === NostrPrefix.PublicKey || link.type === NostrPrefix.Profile
  const hosting = events
    .filter(a => (byPubkey ? getHost(a) === link.id : link.matchesEvent(a)))
    .sort((a, b) => b.created_at - a.created_at)
  if (!byPubkey) return hosting.at(0)
  return hosting.find(a => findTag(a, "status") === StreamState.Live) ?? hosting.at(0)
}
