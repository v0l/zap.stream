import { LIVE_STREAM_CLIP } from "@/const";
import { NostrLink, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { useMemo } from "react";

export function useProfileClips(link?: NostrLink, limit?: number) {
  const sub = useMemo(() => {
    const rb = new RequestBuilder(`clips:${link?.id}`);

    if (link) {
      rb.withFilter().kinds([LIVE_STREAM_CLIP]).tag("p", [link.id]).limit(limit);
    }
    return rb;
  }, [link]);

  return useRequestBuilder(sub);
}

export function useRecentClips(limit?: number) {
  const sub = useMemo(() => {
    const rb = new RequestBuilder("recent-clips");
    rb.withFilter().kinds([LIVE_STREAM_CLIP]).limit(limit);
    return rb;
  }, [limit]);

  return useRequestBuilder(sub);
}
