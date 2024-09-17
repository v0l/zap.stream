import { useMemo } from "react";
import { EventKind, NostrLink, RequestBuilder, parseZap } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

export function useZaps(link?: NostrLink, leaveOpen = false) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`zaps:${link?.id}`);
    if (link) {
      b.withOptions({ leaveOpen });
      b.withFilter().kinds([EventKind.ZapReceipt]).replyToLink([link]);
    }
    return b;
  }, [link, leaveOpen]);

  const zaps = useRequestBuilder(sub);

  return useMemo(
    () =>
      [...(zaps ?? [])]
        .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
        .map(ev => parseZap(ev))
        .filter(z => z && z.valid) ?? [],
    [zaps.length],
  );
}
