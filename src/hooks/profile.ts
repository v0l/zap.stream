import { useMemo } from "react";
import { NostrLink, NoteCollection, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { LIVE_STREAM } from "@/const";
import { useZaps } from "./zaps";

export function useProfile(link: NostrLink, leaveOpen = false) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`profile:${link.id.slice(0, 12)}`);
    b.withOptions({
      leaveOpen,
    })
      .withFilter()
      .kinds([LIVE_STREAM])
      .authors([link.id]);

    b.withFilter().kinds([LIVE_STREAM]).tag("p", [link.id]);

    return b;
  }, [link, leaveOpen]);

  const streams = useRequestBuilder(NoteCollection, sub);
  const zaps = useZaps(link);

  const sortedStreams = useMemo(() => {
    const sorted = [...(streams.data ?? [])].sort((a, b) => b.created_at - a.created_at);
    return sorted;
  }, [streams]);

  return {
    streams: sortedStreams,
    zaps,
  };
}
