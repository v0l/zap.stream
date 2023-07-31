import { useMemo } from "react";

import { NoteCollection, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

import { unixNow } from "@snort/shared";
import { LIVE_STREAM } from "const";
import { System, StreamState } from "index";
import { findTag, dedupeByHost } from "utils";

export function useStreamsFeed(tag?: string) {
  const rb = useMemo(() => {
    const rb = new RequestBuilder(tag ? `streams:${tag}` : "streams");
    rb.withOptions({
      leaveOpen: true,
    });
    if (tag) {
      rb.withFilter()
        .kinds([LIVE_STREAM])
        .tag("t", [tag])
        .since(unixNow() - 86400);
    } else {
      rb.withFilter()
        .kinds([LIVE_STREAM])
        .since(unixNow() - 86400);
    }
    return rb;
  }, [tag]);

  const feed = useRequestBuilder<NoteCollection>(System, NoteCollection, rb);
  const feedSorted = useMemo(() => {
    if (feed.data) {
      return [...feed.data].sort((a, b) => {
        const aStatus = findTag(a, "status")!;
        const bStatus = findTag(b, "status")!;
        if (aStatus === bStatus) {
          const aStart = Number(findTag(a, "starts") ?? "0");
          const bStart = Number(findTag(b, "starts") ?? "0");
          return bStart > aStart ? 1 : -1;
        } else {
          return aStatus === "live" ? -1 : 1;
        }
      });
    }
    return [];
  }, [feed.data]);

  const live = dedupeByHost(
    feedSorted.filter((a) => findTag(a, "status") === StreamState.Live),
  );
  const planned = dedupeByHost(
    feedSorted.filter((a) => findTag(a, "status") === StreamState.Planned),
  );
  const ended = dedupeByHost(
    feedSorted.filter((a) => {
      const hasEnded = findTag(a, "status") === StreamState.Ended;
      const recording = findTag(a, "recording");
      return hasEnded && recording?.length > 0;
    }),
  );

  return { live, planned, ended };
}
