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
    const parsed = zapEvents.map(a => parseZap(a));
    return {
      parsed: parsed,
      all: zapEvents,
      topPubkeys: parsed.reduce(
        (acc, v) => {
          if (v.receiver) {
            acc[v.receiver] ??= 0;
            acc[v.receiver] += v.amount;
          }
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }, [zapEvents]);

  return zaps;
}
