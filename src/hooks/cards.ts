import { useMemo } from "react"

import { RequestBuilder, type TaggedNostrEvent } from "@snort/system"
import { useRequestBuilder } from "@snort/system-react"

import { CARD, USER_CARDS } from "@/const"
import { findTag } from "@/utils"

export function latestCardTags(userCards: Array<Pick<TaggedNostrEvent, "created_at" | "tags">>): string[][] {
  const latest = userCards.reduce<(typeof userCards)[number] | undefined>(
    (best, ev) => (!best || ev.created_at > best.created_at ? ev : best),
    undefined,
  )
  return latest?.tags.filter(t => t.at(0) === "a" && t.at(1)?.startsWith(`${CARD}:`)) ?? []
}

export function useCards(pubkey?: string, leaveOpen = false): TaggedNostrEvent[] {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`user-cards:${pubkey}`)

    if (pubkey) {
      b.withOptions({
        leaveOpen,
      })
        .withFilter()
        .authors([pubkey])
        .kinds([USER_CARDS])
    }
    return b
  }, [pubkey, leaveOpen])

  const userCards = useRequestBuilder(sub)

  const related = useMemo(() => latestCardTags(userCards), [userCards])

  const subRelated = useMemo(() => {
    const splitted = related.map(t => t[1].split(":"))
    const authors = splitted
      .map(s => s.at(1))
      .filter(s => s)
      .map(s => s as string)
    const identifiers = splitted
      .map(s => s.at(2))
      .filter(s => s)
      .map(s => s as string)

    const rb = new RequestBuilder(`cards:${pubkey}`)

    if (pubkey && authors.length > 0 && identifiers.length > 0) {
      rb.withOptions({ leaveOpen }).withFilter().kinds([CARD]).authors(authors).tag("d", identifiers)
    }

    return rb
  }, [pubkey, related, leaveOpen])

  const data = useRequestBuilder(subRelated)
  const cardEvents = data ?? []

  const cards = useMemo(() => {
    return related
      .map(t => {
        const [k, pubkey, identifier] = t[1].split(":")
        const kind = Number(k)
        return cardEvents.find(e => e.kind === kind && e.pubkey === pubkey && findTag(e, "d") === identifier)
      })
      .filter(e => e)
      .map(e => e as TaggedNostrEvent)
  }, [related, cardEvents])

  return cards
}
