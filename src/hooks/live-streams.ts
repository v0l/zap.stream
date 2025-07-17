import { useMemo } from "react";
import { RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { LIVE_STREAM_KINDS, WHITELIST } from "@/const";

export function useStreamsFeed(tag?: string) {
  const rb = useMemo(() => {
    const rb = new RequestBuilder(tag ? `streams:${tag}` : "streams");
    rb.withOptions({
      leaveOpen: true,
    });
    if (WHITELIST) {
      if (tag) {
        rb.withFilter().kinds(LIVE_STREAM_KINDS).tag("t", [tag]).authors(WHITELIST);
        rb.withFilter().kinds(LIVE_STREAM_KINDS).tag("t", [tag]).tag("p", WHITELIST);
      } else {
        rb.withFilter().kinds(LIVE_STREAM_KINDS).authors(WHITELIST);
        rb.withFilter().kinds(LIVE_STREAM_KINDS).tag("p", WHITELIST);
      }
    } else {
      if (tag) {
        rb.withFilter().kinds(LIVE_STREAM_KINDS).tag("t", [tag]);
      } else {
        rb.withFilter().kinds(LIVE_STREAM_KINDS);
      }
    }
    return rb;
  }, [tag]);

  return useRequestBuilder(rb);
}
