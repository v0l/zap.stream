import { useMemo } from "react";
import { RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { LIVE_STREAM, WHITELIST } from "@/const";

export function useStreamsFeed(tag?: string) {
  const liveStreamKinds = [LIVE_STREAM];
  const rb = useMemo(() => {
    const rb = new RequestBuilder(tag ? `streams:${tag}` : "streams");
    rb.withOptions({
      leaveOpen: true,
    });
    if (WHITELIST) {
      if (tag) {
        rb.withFilter()
          .kinds(liveStreamKinds)
          .tag("t", [tag])
          .authors(WHITELIST);
        rb.withFilter()
          .kinds(liveStreamKinds)
          .tag("t", [tag])
          .tag("p", WHITELIST);
      } else {
        rb.withFilter()
          .kinds(liveStreamKinds)
          .authors(WHITELIST);
        rb.withFilter()
          .kinds(liveStreamKinds)
          .tag("p", WHITELIST);
      }
    } else {
      if (tag) {
        rb.withFilter().kinds(liveStreamKinds).tag("t", [tag]);
      } else {
        rb.withFilter().kinds(liveStreamKinds);
      }
    }
    return rb;
  }, [tag]);

  return useRequestBuilder(rb);
}
