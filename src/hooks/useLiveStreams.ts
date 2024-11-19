import { DAY, LIVE_STREAM, StreamState } from "@/const";
import { findTag, getHost } from "@/utils";
import { unixNow } from "@snort/shared";
import { NostrEvent, TaggedNostrEvent } from "@snort/system";
import { useMemo } from "react";

export function useSortedStreams(feed: Array<TaggedNostrEvent>, oldest?: number) {
  function sortCreatedAt(a: NostrEvent, b: NostrEvent) {
    return b.created_at > a.created_at ? 1 : -1;
  }

  function sortStarts(a: NostrEvent, b: NostrEvent) {
    const aStart = Number(findTag(a, "starts") ?? "0");
    const bStart = Number(findTag(b, "starts") ?? "0");
    return bStart > aStart ? 1 : -1;
  }

  const feedSorted = useMemo(() => {
    if (feed) {
      return feed
        .filter(a => a.created_at > (oldest ?? unixNow() - 7 * DAY))
        .filter(a => !import.meta.env.VITE_SINGLE_PUBLISHER || import.meta.env.VITE_SINGLE_PUBLISHER === getHost(a));
    }
    return [];
  }, [feed]);

  function canPlayEvent(ev: NostrEvent) {
    if (ev.kind === LIVE_STREAM) {
      const isHls = ev.tags.some(a => a[0] === "streaming" && a[1].includes(".m3u8"));
      const isN94 = ev.tags.some(a => a[0] === "streaming" && a[1] == "nip94");
      return isHls || isN94;
    }
    return false;
  }

  const live = feedSorted
    .filter(a => {
      try {
        return (
          findTag(a, "status") === StreamState.Live && canPlayEvent(a)
        );
      } catch {
        return false;
      }
    })
    .sort(sortStarts);
  const planned = feedSorted.filter(a => findTag(a, "status") === StreamState.Planned).sort(sortStarts);
  const ended = feedSorted
    .filter(a => {
      const hasEnded = findTag(a, "status") === StreamState.Ended;
      const recording = findTag(a, "recording") ?? "";
      return hasEnded && recording?.length > 0;
    })
    .sort(sortCreatedAt);
  return { live, planned, ended };
}
