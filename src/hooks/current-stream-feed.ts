import { NostrLink, RequestBuilder, TaggedNostrEvent } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { useMemo } from "react";

import { LIVE_STREAM_KINDS } from "@/const";
import { getHost } from "@/utils";
import { NostrPrefix } from "@snort/shared";

export function useCurrentStreamFeed(link: NostrLink, leaveOpen = false, evPreload?: TaggedNostrEvent) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`current-event:${link.id}`);
    b.withOptions({
      leaveOpen,
    });
    if (link.type === NostrPrefix.PublicKey || link.type === NostrPrefix.Profile) {
      b.withFilter().authors([link.id]).kinds(LIVE_STREAM_KINDS).limit(10);
      b.withFilter().tag("p", [link.id]).kinds(LIVE_STREAM_KINDS).limit(10);
    } else {
      b.withFilter().link(link);
    }
    return b;
  }, [link.id, leaveOpen]);

  const q = useRequestBuilder(sub);

  return useMemo(() => {
    const hosting = [...q, ...(evPreload ? [evPreload] : [])]
      .filter(a => {
        if (link.type === NostrPrefix.PublicKey || link.type === NostrPrefix.Profile) {
          const host = getHost(a);
          return host === link.id;
        } else {
          return link.matchesEvent(a);
        }
      })
      .sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    return hosting.at(0);
  }, [q]);
}
