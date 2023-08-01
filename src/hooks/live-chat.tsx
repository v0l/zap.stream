import {
  NostrLink,
  RequestBuilder,
  EventKind,
  FlatNoteStore,
} from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { unixNow } from "@snort/shared";
import { System } from "index";
import { useMemo } from "react";
import { LIVE_STREAM_CHAT, WEEK } from "const";

export function useLiveChatFeed(link: NostrLink, eZaps?: Array<string>) {
  const since = useMemo(() => unixNow() - WEEK, [link.id]);
  const sub = useMemo(() => {
    const rb = new RequestBuilder(`live:${link.id}:${link.author}`);
    rb.withOptions({
      leaveOpen: true,
    });

    const aTag = `${link.kind}:${link.author}:${link.id}`;
    rb.withFilter().kinds([LIVE_STREAM_CHAT]).tag("a", [aTag]).limit(100);
    rb.withFilter().kinds([EventKind.ZapReceipt]).tag("a", [aTag]).since(since);
    if (eZaps) {
      rb.withFilter().kinds([EventKind.ZapReceipt]).tag("e", eZaps);
    }
    return rb;
  }, [link.id, since, eZaps]);

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
    esub,
  );

  const reactions = reactionsSub.data ?? [];

  return { messages, zaps, reactions };
}
