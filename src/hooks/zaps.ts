import { useMemo } from "react";
import { EventKind, NostrLink, NoteCollection, RequestBuilder, parseZap } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

export function useZaps(link?: NostrLink, leaveOpen = false) {
  const sub = useMemo(() => {
    if (link) {
      const b = new RequestBuilder(`zaps:${link.id}`);
      b.withOptions({ leaveOpen });
      b.withFilter().kinds([EventKind.ZapReceipt]).replyToLink([link]);
      return b;
    }
    return null;
  }, [link, leaveOpen]);

  const zaps = useRequestBuilder(sub);

  return (
    [...(zaps ?? [])]
      .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
      .map(ev => parseZap(ev))
      .filter(z => z && z.valid) ?? []
  );
}
