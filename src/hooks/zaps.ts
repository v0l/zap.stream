import { useMemo } from "react";
import { NostrLink, RequestBuilder, EventKind, NoteCollection, parseZap } from "@snort/system";
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

  const { data: zaps } = useRequestBuilder(NoteCollection, sub);

  return (
    [...(zaps ?? [])]
      .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
      .map(ev => parseZap(ev))
      .filter(z => z && z.valid) ?? []
  );
}
