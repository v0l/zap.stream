import { DAY, LIVE_STREAM, N94_LIVE_STREAM, StreamState, WHITELIST } from "@/const";
import { findTag, getHost } from "@/utils";
import { unixNow } from "@snort/shared";
import { EventKind, NostrEvent, NostrLink, NostrPrefix, RequestBuilder, TaggedNostrEvent } from "@snort/system";
import { SnortContext, useRequestBuilder } from "@snort/system-react";
import { useContext, useMemo } from "react";

export function useSortedStreams(feed: Array<TaggedNostrEvent>, oldest?: number, showDeleted?: boolean) {
  function sortCreatedAt(a: NostrEvent, b: NostrEvent) {
    return b.created_at > a.created_at ? 1 : -1;
  }

  function sortStarts(a: NostrEvent, b: NostrEvent) {
    const aStart = Number(findTag(a, "starts") ?? "0");
    const bStart = Number(findTag(b, "starts") ?? "0");
    return bStart > aStart ? 1 : -1;
  }

  function canPlayEvent(ev: NostrEvent) {
    if (ev.kind === LIVE_STREAM) {
      const isHls = ev.tags.some(a => (a[0] === "streaming" || a[0] === "recording") && a[1].includes(".m3u8"));
      return isHls;
    }
    return ev.kind === N94_LIVE_STREAM;
  }

  const feedSorted = useMemo(() => {
    if (feed) {
      return feed
        .filter(a => a.created_at > (oldest ?? unixNow() - 7 * DAY))
        .filter(a => canPlayEvent(a))
        .filter(a => !WHITELIST || WHITELIST.includes(getHost(a)))
        .filter(a => showDeleted || findTag(a, "deleted") !== "1");
    }
    return [];
  }, [feed, oldest, showDeleted]);

  const live = feedSorted
    .filter(a => {
      try {
        return (findTag(a, "status") === StreamState.Live || a.kind === N94_LIVE_STREAM);
      } catch {
        return false;
      }
    })
    .sort(sortStarts);

  // Load deletion requests for live events to clear cache relay
  const system = useContext(SnortContext);
  if (system.config.cachingRelay) {
    const rbDeletes = new RequestBuilder("stream-deletes");
    const links = useMemo(() => live.map(a => NostrLink.fromEvent(a)), [live]);
    const aDeletes = links.filter(a => a.type === NostrPrefix.Address);
    if (aDeletes.length > 0) {
      rbDeletes.withFilter().replyToLink(aDeletes).kinds([EventKind.Deletion]);
    }
    const eDeletes = links.filter(a => a.type === NostrPrefix.Event);
    if (eDeletes.length > 0) {
      rbDeletes.withFilter().replyToLink(eDeletes).kinds([EventKind.Deletion]);
    }
    useRequestBuilder(rbDeletes);
  }

  const planned = feedSorted.filter(a => findTag(a, "status") === StreamState.Planned).sort(sortStarts);
  const ended = feedSorted
    .filter(a => {
      const hasEnded = findTag(a, "status") === StreamState.Ended;
      const recording = findTag(a, "recording") ?? "";
      const isDeleted = findTag(a, "deleted") === "1";
      return hasEnded && recording?.length > 0 && (showDeleted || !isDeleted);
    })
    .sort(sortCreatedAt);
  return { live, planned, ended };
}
