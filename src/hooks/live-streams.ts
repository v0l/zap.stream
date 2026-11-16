import { useMemo } from "react"
import { RequestBuilder } from "@snort/system"
import { unixNow } from "@snort/shared"
import { useRequestBuilder } from "@snort/system-react"
import { DAY, LIVE_STREAM_KINDS, WHITELIST } from "@/const"

export const STREAM_FEED_WINDOW = 7 * DAY

export function useStreamsFeed(tag?: string) {
  const rb = useMemo(() => {
    const rb = new RequestBuilder(tag ? `streams:${tag}` : "streams")
    rb.withOptions({
      leaveOpen: true,
    })
    const since = unixNow() - STREAM_FEED_WINDOW
    if (WHITELIST) {
      if (tag) {
        rb.withFilter().kinds(LIVE_STREAM_KINDS).tag("t", [tag]).authors(WHITELIST).since(since)
        rb.withFilter().kinds(LIVE_STREAM_KINDS).tag("t", [tag]).tag("p", WHITELIST).since(since)
      } else {
        rb.withFilter().kinds(LIVE_STREAM_KINDS).authors(WHITELIST).since(since)
        rb.withFilter().kinds(LIVE_STREAM_KINDS).tag("p", WHITELIST).since(since)
      }
    } else {
      if (tag) {
        rb.withFilter().kinds(LIVE_STREAM_KINDS).tag("t", [tag]).since(since)
      } else {
        rb.withFilter().kinds(LIVE_STREAM_KINDS).since(since)
      }
    }
    return rb
  }, [tag])

  return useRequestBuilder(rb)
}
