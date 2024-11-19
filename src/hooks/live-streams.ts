import { useMemo } from "react";
import { RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { LIVE_STREAM } from "@/const";

export function useStreamsFeed(tag?: string) {
  const liveStreamKinds = [LIVE_STREAM];
  const rb = useMemo(() => {
    const rb = new RequestBuilder(tag ? `streams:${tag}` : "streams");
    rb.withOptions({
      leaveOpen: true,
    });
    if (import.meta.env.VITE_SINGLE_PUBLISHER) {
      if (tag) {
        rb.withFilter()
          .kinds(liveStreamKinds)
          .tag("t", [tag])
          .authors([import.meta.env.VITE_SINGLE_PUBLISHER]);
        rb.withFilter()
          .kinds(liveStreamKinds)
          .tag("t", [tag])
          .tag("p", [import.meta.env.VITE_SINGLE_PUBLISHER]);
      } else {
        rb.withFilter()
          .kinds(liveStreamKinds)
          .authors([import.meta.env.VITE_SINGLE_PUBLISHER]);
        rb.withFilter()
          .kinds(liveStreamKinds)
          .tag("p", [import.meta.env.VITE_SINGLE_PUBLISHER]);
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
