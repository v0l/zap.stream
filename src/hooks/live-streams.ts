import { useMemo } from "react";

import { NostrEvent, NoteCollection, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

import { unixNow } from "@snort/shared";
import { LIVE_STREAM } from "const";
import { StreamState } from "index";
import { findTag } from "utils";
import { WEEK } from "const";

export function useStreamsFeed(tag?: string) {
  const since = useMemo(() => unixNow() - WEEK, [tag]);
  const rb = useMemo(() => {
    const rb = new RequestBuilder(tag ? `streams:${tag}` : "streams");
    rb.withOptions({
      leaveOpen: true,
    });
    if (tag) {
      rb.withFilter()
        .kinds([LIVE_STREAM])
        .tag("t", [tag])
        .since(since)
        .authors(__SINGLE_PUBLISHER ? [__SINGLE_PUBLISHER] : undefined);
    } else {
      rb.withFilter()
        .kinds([LIVE_STREAM])
        .since(since)
        .authors(__SINGLE_PUBLISHER ? [__SINGLE_PUBLISHER] : undefined);
    }
    return rb;
  }, [tag, since]);

  function sortCreatedAt(a: NostrEvent, b: NostrEvent) {
    return b.created_at > a.created_at ? 1 : -1;
  }

  function sortStarts(a: NostrEvent, b: NostrEvent) {
    const aStart = Number(findTag(a, "starts") ?? "0");
    const bStart = Number(findTag(b, "starts") ?? "0");
    return bStart > aStart ? 1 : -1;
  }

  const feed = useRequestBuilder(NoteCollection, rb);
  const feedSorted = useMemo(() => {
    if (feed.data) {
      if (__XXX) {
        return [...feed.data].filter(a => findTag(a, "content-warning") !== undefined);
      } else {
        return [...feed.data].filter(a => findTag(a, "content-warning") === undefined);
      }
    }
    return [];
  }, [feed.data]);

  const live = feedSorted.filter(a => findTag(a, "status") === StreamState.Live).sort(sortStarts);
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
