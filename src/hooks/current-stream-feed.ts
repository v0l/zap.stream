import { NostrLink, NostrPrefix, RequestBuilder, TaggedNostrEvent } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { useMemo } from "react";

import { LIVE_STREAM, N94_LIVE_STREAM } from "@/const";

export function useCurrentStreamFeed(link: NostrLink, leaveOpen = false, evPreload?: TaggedNostrEvent) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`current-event:${link.id}`);
    b.withOptions({
      leaveOpen,
    });
    if (link.type === NostrPrefix.PublicKey || link.type === NostrPrefix.Profile) {
      b.withFilter().authors([link.id]).kinds([LIVE_STREAM, N94_LIVE_STREAM]);
      b.withFilter().tag("p", [link.id]).kinds([LIVE_STREAM, N94_LIVE_STREAM]);
    } else {
      b.withFilter().link(link);
    }
    return b;
  }, [link.id, leaveOpen]);

  const q = useRequestBuilder(sub);

  return useMemo(() => {
    const hosting = [...q, ...(evPreload ? [evPreload] : [])].sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    return hosting.at(0);
  }, [q]);
}
