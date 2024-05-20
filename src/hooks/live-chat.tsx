import { NostrLink } from "@snort/system";
import { useReactions } from "@snort/system-react";
import { LIVE_STREAM_CHAT, LIVE_STREAM_CLIP, LIVE_STREAM_RAID } from "@/const";

export function useLiveChatFeed(link?: NostrLink, limit?: number) {
  const reactions = useReactions(
    `live:${link?.id}:${link?.author}:reactions`,
    [],
    rb => {
      if (link) {
        const aTag = `${link.kind}:${link.author}:${link.id}`;
        rb.withFilter().kinds([LIVE_STREAM_CHAT, LIVE_STREAM_RAID, LIVE_STREAM_CLIP]).tag("a", [aTag]).limit(limit);
      }
    },
    true,
  );
  return { messages, reactions: reactions ?? [] };
}
