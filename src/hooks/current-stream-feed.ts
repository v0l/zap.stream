import { unwrap } from "@snort/shared";
import { NostrEvent, NostrLink, NostrPrefix, NoteCollection, RequestBuilder, TaggedNostrEvent } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { LIVE_STREAM } from "const";
import { useMemo } from "react";

export function useCurrentStreamFeed(link: NostrLink, leaveOpen = false, evPreload?: NostrEvent) {
  const author = link.type === NostrPrefix.Address ? unwrap(link.author) : link.id;
  const sub = useMemo(() => {
    const b = new RequestBuilder(`current-event:${link.id}`);
    b.withOptions({
      leaveOpen,
    });
    if (link.type === NostrPrefix.PublicKey || link.type === NostrPrefix.Profile) {
      b.withFilter().authors([link.id]).kinds([LIVE_STREAM]).limit(1);
      b.withFilter().tag("p", [link.id]).kinds([LIVE_STREAM]).limit(1);
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

  const q = useRequestBuilder(NoteCollection, sub);

  if (evPreload) {
    q.add(evPreload as TaggedNostrEvent);
  }

  return useMemo(() => {
    const hosting = q.data?.filter(
      a => a.pubkey === author || a.tags.some(b => b[0] === "p" && b[1] === author && b[3] === "host")
    );
    return [...(hosting ?? [])].sort((a, b) => (b.created_at > a.created_at ? 1 : -1)).at(0);
  }, [q.data]);
}
