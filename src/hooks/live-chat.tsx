import { NostrLink, RequestBuilder, EventKind, NoteCollection } from "@snort/system";
import { SnortContext, useRequestBuilder } from "@snort/system-react";
import { unixNow, unwrap } from "@snort/shared";
import { useContext, useEffect, useMemo } from "react";
import { LIVE_STREAM_CHAT, WEEK } from "const";
import { findTag } from "utils";

export function useLiveChatFeed(link: NostrLink, eZaps?: Array<string>) {
  const system = useContext(SnortContext);
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

  const feed = useRequestBuilder(NoteCollection, sub);

  const messages = useMemo(() => {
    return (feed.data ?? []).filter(ev => ev.kind === LIVE_STREAM_CHAT);
  }, [feed.data]);
  const zaps = useMemo(() => {
    return (feed.data ?? []).filter(ev => ev.kind === EventKind.ZapReceipt);
  }, [feed.data]);

  const etags = useMemo(() => {
    return messages.map(e => e.id);
  }, [messages]);

  const esub = useMemo(() => {
    if (etags.length === 0) return null;
    const rb = new RequestBuilder(`reactions:${link.id}:${link.author}`);
    rb.withOptions({
      leaveOpen: true,
    });
    rb.withFilter().kinds([EventKind.Reaction, EventKind.ZapReceipt]).tag("e", etags);
    return rb;
  }, [etags]);

  useEffect(() => {
    const pubkeys = [...new Set(zaps.flatMap(a => [a.pubkey, unwrap(findTag(a, "p"))]))];
    system.ProfileLoader.TrackMetadata(pubkeys);
    return () => system.ProfileLoader.UntrackMetadata(pubkeys);
  }, [zaps]);

  const reactionsSub = useRequestBuilder(NoteCollection, esub);

  const reactions = reactionsSub.data ?? [];

  return { messages, zaps, reactions };
}
