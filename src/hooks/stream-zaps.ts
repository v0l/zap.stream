import { DAY } from "@/const"
import { unixNow } from "@snort/shared"
import { type NostrLink, type ParsedZap, RequestBuilder, parseZap } from "@snort/system"
import { zapReceiptsFor } from "./zaps"
import { useRequestBuilder } from "@snort/system-react"
import { useMemo } from "react"

export type ZapTotal = Pick<ParsedZap, "amount" | "created_at" | "targetEvents">

export function sumZapsByStream(zaps: Array<ZapTotal>, links: Array<NostrLink>, since: number) {
  const keys = new Set(links.map(a => a.tagKey))
  const totals: Record<string, number> = {}
  for (const zap of zaps) {
    if (zap.created_at < since) continue
    const targets = new Set(zap.targetEvents.map(a => a.tagKey).filter(a => keys.has(a)))
    for (const key of targets) {
      totals[key] = (totals[key] ?? 0) + zap.amount
    }
  }
  return totals
}

export function useRecentStreamZaps(links: Array<NostrLink>, window = DAY) {
  const linkKey = links
    .map(a => a.tagKey)
    .sort()
    .join(",")
  const since = useMemo(() => unixNow() - window, [linkKey, window])
  const rb = useMemo(() => {
    const rb = new RequestBuilder(`recent-stream-zaps:${linkKey}`)
    rb.withOptions({ leaveOpen: true })
    if (links.length > 0) {
      for (const f of zapReceiptsFor(rb, links)) f.since(since)
    }
    return rb
  }, [linkKey, since])
  const events = useRequestBuilder(rb)
  const eventKey = events.map(a => a.id).join(",")

  return useMemo(() => {
    const zaps = events
      .map(a => parseZap(a))
      .filter(a => a.valid)
      .sort((a, b) => b.created_at - a.created_at)
    return {
      zaps,
      totals: sumZapsByStream(zaps, links, since),
    }
  }, [eventKey, linkKey, since])
}
