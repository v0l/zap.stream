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

  const feed = useRequestBuilder<FlatNoteStore>(System, FlatNoteStore, sub);

  const messages = useMemo(() => {
    return (feed.data ?? []).filter((ev) => ev.kind === LIVE_STREAM_CHAT);
  }, [feed.data]);
  const zaps = useMemo(() => {
    return (feed.data ?? []).filter((ev) => ev.kind === EventKind.ZapReceipt);
  }, [feed.data]);

  const etags = useMemo(() => {
    return messages.map((e) => e.id);
  }, [messages]);

  const esub = useMemo(() => {
    if (etags.length === 0) return null;
    const rb = new RequestBuilder(`reactions:${link.id}:${link.author}`);
    rb.withOptions({
      leaveOpen: true,
    });
    rb.withFilter()
      .kinds([EventKind.Reaction, EventKind.ZapReceipt])
      .tag("e", etags);
    return rb;
  }, [etags]);

  const reactionsSub = useRequestBuilder<FlatNoteStore>(
    System,
    FlatNoteStore,
    esub
  );

  const reactions = reactionsSub.data ?? [];

  return { messages, zaps, reactions };
}
