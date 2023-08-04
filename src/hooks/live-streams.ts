import { useMemo } from "react";

import { NoteCollection, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

import { unixNow } from "@snort/shared";
import { LIVE_STREAM } from "const";
import { System, StreamState } from "index";
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
      rb.withFilter().kinds([LIVE_STREAM]).tag("t", [tag]).since(since);
    } else {
      rb.withFilter().kinds([LIVE_STREAM]).since(since);
    }
    return rb;
  }, [tag, since]);

  const feed = useRequestBuilder<NoteCollection>(System, NoteCollection, rb);
  const feedSorted = useMemo(() => {
    if (feed.data) {
      return [...feed.data].sort((a, b) => {
        const status = findTag(a, "status");
        if (status === StreamState.Ended) {
          return b.created_at > a.created_at ? 1 : -1;
        }
        const aStart = Number(findTag(a, "starts") ?? "0");
        const bStart = Number(findTag(b, "starts") ?? "0");
        return bStart > aStart ? 1 : -1;
      });
    }
    return [];
  }, [feed.data]);

  const live = feedSorted.filter(
    (a) => findTag(a, "status") === StreamState.Live
  );
  const planned = feedSorted.filter(
    (a) => findTag(a, "status") === StreamState.Planned
  );
  const ended = feedSorted.filter((a) => {
    const hasEnded = findTag(a, "status") === StreamState.Ended;
    const recording = findTag(a, "recording") ?? "";
    return hasEnded && recording?.length > 0;
  });

  return { live, planned, ended };
}
