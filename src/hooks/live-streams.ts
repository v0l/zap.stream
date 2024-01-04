import { useMemo } from "react";

import { NostrEvent, NoteCollection, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

import { unixNow } from "@snort/shared";
import { LIVE_STREAM, StreamState } from "@/const";
import { findTag, getHost } from "@/utils";
import { WEEK } from "@/const";

export function useStreamsFeed(tag?: string) {
  const since = useMemo(() => unixNow() - WEEK, [tag]);
  const rb = useMemo(() => {
    const rb = new RequestBuilder(tag ? `streams:${tag}` : "streams");
    rb.withOptions({
      leaveOpen: true,
    });
    if (import.meta.env.VITE_SINGLE_PUBLISHER) {
      if (tag) {
        rb.withFilter().kinds([LIVE_STREAM]).tag("t", [tag]).authors([import.meta.env.VITE_SINGLE_PUBLISHER]);
        rb.withFilter().kinds([LIVE_STREAM]).tag("t", [tag]).tag("p", [import.meta.env.VITE_SINGLE_PUBLISHER]);
      } else {
        rb.withFilter().kinds([LIVE_STREAM]).authors([import.meta.env.VITE_SINGLE_PUBLISHER]);
        rb.withFilter().kinds([LIVE_STREAM]).tag("p", [import.meta.env.VITE_SINGLE_PUBLISHER]);
      }
    } else {
      if (tag) {
        rb.withFilter().kinds([LIVE_STREAM]).tag("t", [tag]).since(since);
      } else {
        rb.withFilter().kinds([LIVE_STREAM]).since(since);
      }
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
        return [...feed.data].filter(
          a => findTag(a, "content-warning") !== undefined && (!import.meta.env.VITE_SINGLE_PUBLISHER || import.meta.env.VITE_SINGLE_PUBLISHER === getHost(a))
        );
      } else {
        return [...feed.data].filter(
          a => findTag(a, "content-warning") === undefined && (!import.meta.env.VITE_SINGLE_PUBLISHER || import.meta.env.VITE_SINGLE_PUBLISHER === getHost(a))
        );
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
