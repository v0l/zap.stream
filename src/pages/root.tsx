import "./root.css";

import { useMemo } from "react";
import { unixNow } from "@snort/shared";
import {
  ParameterizedReplaceableNoteStore,
  RequestBuilder,
} from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { StreamState, System } from "..";
import { VideoTile } from "../element/video-tile";
import { findTag } from "utils";
import { LIVE_STREAM } from "const";

export function RootPage() {
  const rb = useMemo(() => {
    const rb = new RequestBuilder("root");
    rb.withOptions({
      leaveOpen: true,
    })
      .withFilter()
      .kinds([LIVE_STREAM])
      .since(unixNow() - 86400);
    return rb;
  }, []);

  const feed = useRequestBuilder<ParameterizedReplaceableNoteStore>(
    System,
    ParameterizedReplaceableNoteStore,
    rb
  );
  const feedSorted = useMemo(() => {
    if (feed.data) {
      return [...feed.data].sort((a, b) => {
        const aStatus = findTag(a, "status")!;
        const bStatus = findTag(b, "status")!;
        if (aStatus === bStatus) {
          return b.created_at > a.created_at ? 1 : -1;
        } else {
          return aStatus === "live" ? -1 : 1;
        }
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
  const ended = feedSorted.filter(
    (a) => findTag(a, "status") === StreamState.Ended
  );
  return (
    <div className="homepage">
      <div className="video-grid">
        {live.map((e) => (
          <VideoTile ev={e} key={e.id} />
        ))}
      </div>
      {planned.length > 0 && (
        <>
          <h2>Planned</h2>
          <div className="video-grid">
            {planned.map((e) => (
              <VideoTile ev={e} key={e.id} />
            ))}
          </div>
        </>
      )}
      {ended.length > 0 && (
        <>
          <h2>Ended</h2>
          <div className="video-grid">
            {ended.map((e) => (
              <VideoTile ev={e} key={e.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
