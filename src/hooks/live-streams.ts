import { useMemo } from "react";
import { EventKind, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

export function useStreamsFeed(tag?: string) {
  const rb = useMemo(() => {
    const rb = new RequestBuilder(tag ? `streams:${tag}` : "streams");
    rb.withOptions({
      leaveOpen: true,
    });
    if (import.meta.env.VITE_SINGLE_PUBLISHER) {
      if (tag) {
        rb.withFilter()
          .kinds([EventKind.LiveEvent])
          .tag("t", [tag])
          .authors([import.meta.env.VITE_SINGLE_PUBLISHER]);
        rb.withFilter()
          .kinds([EventKind.LiveEvent])
          .tag("t", [tag])
          .tag("p", [import.meta.env.VITE_SINGLE_PUBLISHER]);
      } else {
        rb.withFilter()
          .kinds([EventKind.LiveEvent])
          .authors([import.meta.env.VITE_SINGLE_PUBLISHER]);
        rb.withFilter()
          .kinds([EventKind.LiveEvent])
          .tag("p", [import.meta.env.VITE_SINGLE_PUBLISHER]);
      }
    } else {
      if (tag) {
        rb.withFilter().kinds([EventKind.LiveEvent]).tag("t", [tag]);
      } else {
        rb.withFilter().kinds([EventKind.LiveEvent]);
      }
    }
    return rb;
  }, [tag]);

  return useRequestBuilder(rb);
}
