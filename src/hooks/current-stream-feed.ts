import { unwrap } from "@snort/shared";
import { NostrLink, NostrPrefix, RequestBuilder, TaggedNostrEvent } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { useMemo } from "react";

import { LIVE_STREAM } from "@/const";
import { getHost } from "@/utils";

export function useCurrentStreamFeed(link: NostrLink, leaveOpen = false, evPreload?: TaggedNostrEvent) {
  const author = link.type === NostrPrefix.Address ? unwrap(link.author) : link.id;
  const sub = useMemo(() => {
    const b = new RequestBuilder(`current-event:${link.id}`);
    b.withOptions({
      leaveOpen,
    });
    if (link.type === NostrPrefix.PublicKey || link.type === NostrPrefix.Profile) {
      b.withFilter().authors([link.id]).kinds([LIVE_STREAM]);
      b.withFilter().tag("p", [link.id]).kinds([LIVE_STREAM]);
    } else if (link.type === NostrPrefix.Address) {
      const f = b.withFilter().tag("d", [link.id]);
      if (link.author) {
        f.authors([link.author]);
      }
      if (link.kind) {
        f.kinds([link.kind]);
      }
    }
    return b;
  }, [link.id, leaveOpen]);

  const q = useRequestBuilder(sub);

  return useMemo(() => {
    const hosting = [...q, ...(evPreload ? [evPreload] : [])]
      .filter(a => getHost(a) === author || a.pubkey === author)
      .sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    return hosting.at(0);
  }, [q]);
}
