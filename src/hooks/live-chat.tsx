import {
  NostrLink,
  RequestBuilder,
  EventKind,
  FlatNoteStore,
} from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { System } from "index";
import { useMemo } from "react";
import { LIVE_STREAM_CHAT } from "const";

export function useLiveChatFeed(link: NostrLink) {
  const sub = useMemo(() => {
    const rb = new RequestBuilder(`live:${link.id}:${link.author}`);
    rb.withOptions({
      leaveOpen: true,
    });
    rb.withFilter()
      .kinds([EventKind.ZapReceipt, LIVE_STREAM_CHAT])
      .tag("a", [`${link.kind}:${link.author}:${link.id}`])
      .limit(100);
    return rb;
  }, [link]);

  return useRequestBuilder<FlatNoteStore>(System, FlatNoteStore, sub);
}
