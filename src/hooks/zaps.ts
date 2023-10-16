import { useContext, useMemo, useEffect } from "react";
import { unwrap } from "@snort/shared";
import { NostrLink, RequestBuilder, NostrPrefix, EventKind, NoteCollection, parseZap } from "@snort/system";
import { SnortContext, useRequestBuilder } from "@snort/system-react";
import { findTag } from "utils";

export function useZaps(link?: NostrLink, leaveOpen = false) {
  const system = useContext(SnortContext);
  const sub = useMemo(() => {
    if (link) {
      const b = new RequestBuilder(`zaps:${link.id}`);
      b.withOptions({ leaveOpen });
      if (link.type === NostrPrefix.Event || link.type === NostrPrefix.Note) {
        b.withFilter().kinds([EventKind.ZapReceipt]).tag("e", [link.id]);
      } else if (link.type === NostrPrefix.Address) {
        b.withFilter()
          .kinds([EventKind.ZapReceipt])
          .tag("a", [`${link.kind}:${link.author}:${link.id}`]);
      }
      return b;
    }
    return null;
  }, [link, leaveOpen]);

  const { data: zaps } = useRequestBuilder(NoteCollection, sub);

  useEffect(() => {
    const pubkeys = zaps ? [...new Set(zaps.flatMap(a => [a.pubkey, unwrap(findTag(a, "p"))]))] : [];
    system.ProfileLoader.TrackMetadata(pubkeys);
    return () => system.ProfileLoader.UntrackMetadata(pubkeys);
  }, [zaps]);

  return (
    [...(zaps ?? [])]
      .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
      .map(ev => parseZap(ev, system.ProfileLoader.Cache))
      .filter(z => z && z.valid) ?? []
  );
}
