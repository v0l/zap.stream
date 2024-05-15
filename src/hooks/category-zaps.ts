import { EventKind, NostrLink, RequestBuilder, parseZap } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { useMemo } from "react";

export function useCategoryZaps(gameId: string) {
  const rb = new RequestBuilder(`cat-zaps:${gameId}`);
  rb.withFilter().kinds([EventKind.LiveEvent]).tag("t", [gameId]);
  const evs = useRequestBuilder(rb);
  const links = evs.map(a => NostrLink.fromEvent(a));

  const rbZaps = useMemo(() => {
    const rb = new RequestBuilder(`cat-zaps:zaps:${gameId}`);
    if (links.length > 0) {
      rb.withFilter().kinds([EventKind.ZapReceipt]).replyToLink(links);
      return rb;
    }
  }, [links]);
  const zapEvents = useRequestBuilder(rbZaps);

  const zaps = useMemo(() => {
    return zapEvents.map(a => parseZap(a));
  }, [zapEvents]);

  return zaps;
}
