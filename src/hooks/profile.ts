import { useMemo } from "react";
import { type NostrLink, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { LIVE_STREAM_KINDS } from "@/const";
import { useZaps } from "./zaps";

export function useProfile(link?: NostrLink, leaveOpen = false) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`profile:${link?.id}`);

    if (link) {
      b.withOptions({
        leaveOpen,
      })
        .withFilter()
        .kinds(LIVE_STREAM_KINDS)
        .authors([link.id]);

      b.withFilter().kinds(LIVE_STREAM_KINDS).tag("p", [link.id]);
    }
    return b;
  }, [link, leaveOpen]);

  const streams = useRequestBuilder(sub);
  const zaps = useZaps(link);

  const sortedStreams = useMemo(() => {
    const sorted = [...(streams ?? [])].sort((a, b) => b.created_at - a.created_at);
    return sorted;
  }, [streams]);

  return {
    streams: sortedStreams,
    zaps,
  };
}
