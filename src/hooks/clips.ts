import { LIVE_STREAM_CLIP } from "@/const";
import { NostrLink, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { useMemo } from "react";

export function useClips(link?: NostrLink, limit?: number) {
    const sub = useMemo(() => {
        if (!link) return;
        const rb = new RequestBuilder(`clips:${link.id.slice(0, 12)}`);
        rb.withFilter().kinds([LIVE_STREAM_CLIP]).tag("p", [link.id]).limit(limit);
        return rb;
    }, [link]);

    return useRequestBuilder(sub);
}