import { useMemo } from "react"
import { EventKind, type NostrLink, RequestBuilder, parseZap } from "@snort/system"
import { useRequestBuilder } from "@snort/system-react"

export function repliesTo(rb: RequestBuilder, links: Array<NostrLink>) {
  const byTag = new Map<string, Array<string>>()
  for (const l of links) {
    const [key, value] = l.toEventTag() ?? []
    if (key && value) byTag.set(key, [...(byTag.get(key) ?? []), value])
  }
  return [...byTag.entries()].map(([key, values]) => rb.withFilter().tag(key, values))
}

export function zapReceiptsFor(rb: RequestBuilder, links: Array<NostrLink>) {
  return repliesTo(rb, links).map(f => f.kinds([EventKind.ZapReceipt]))
}

export function zapsRequest(link?: NostrLink, leaveOpen = false) {
  const b = new RequestBuilder(`zaps:${link?.tagKey}`)
  if (link) {
    b.withOptions({ leaveOpen })
    zapReceiptsFor(b, [link])
  }
  return b
}

export function useZaps(link?: NostrLink, leaveOpen = false) {
  const sub = useMemo(() => zapsRequest(link, leaveOpen), [link?.tagKey, leaveOpen])

  const zaps = useRequestBuilder(sub)

  return useMemo(
    () =>
      [...(zaps ?? [])]
        .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
        .map(ev => parseZap(ev))
        .filter(z => z?.valid) ?? [],
    [zaps],
  )
}
