import { EventKind, NostrLink, RequestBuilder, parseZap } from "@snort/system"
import { useRequestBuilder } from "@snort/system-react"
import { useMemo } from "react"
import { categoryQueryTags } from "@/element/category/category-tags"
import { AllCategories } from "@/element/category/all-categories"

export function useCategoryZaps(gameId: string) {
  const rb = useMemo(() => {
    const b = new RequestBuilder(`cat-zaps:${gameId}`)
    b.withFilter().kinds([EventKind.LiveEvent]).tag("t", categoryQueryTags(gameId, AllCategories))
    return b
  }, [gameId])
  const evs = useRequestBuilder(rb)
  const evKey = evs.map(a => a.id).join(",")
  const links = useMemo(() => evs.map(a => NostrLink.fromEvent(a)), [evKey])

  const rbZaps = useMemo(() => {
    const rb = new RequestBuilder(`cat-zaps:zaps:${gameId}`)
    if (links.length > 0) {
      rb.withFilter().kinds([EventKind.ZapReceipt]).replyToLink(links)
    }
    return rb
  }, [gameId, links])
  const zapEvents = useRequestBuilder(rbZaps)

  const zaps = useMemo(() => {
    const parsed = zapEvents.map(a => parseZap(a))
    return {
      parsed: parsed,
      all: zapEvents,
      topPubkeys: parsed.reduce(
        (acc, v) => {
          if (v.receiver) {
            acc[v.receiver] ??= 0
            acc[v.receiver] += v.amount
          }
          return acc
        },
        {} as Record<string, number>,
      ),
    }
  }, [zapEvents])

  return zaps
}
