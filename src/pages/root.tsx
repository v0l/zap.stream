import "./root.css";
import type { NostrEvent } from "@snort/system";

import { VideoTile } from "element/video-tile";
import { useLogin } from "hooks/login";
import { getHost, getTagValues } from "utils";
import { useStreamsFeed } from "hooks/live-streams";

export function RootPage() {
  const login = useLogin();

  const { live, planned, ended } = useStreamsFeed();
  const mutedHosts = new Set(getTagValues(login?.muted.tags ?? [], "p"));
  const followsHost = (ev: NostrEvent) => {
    return login?.follows.tags?.find((t) => t.at(1) === getHost(ev));
  };
  const hashtags = getTagValues(login?.follows.tags ?? [], "t");
  const following = live.filter(followsHost);
  const liveNow = live.filter((e) => !following.includes(e));
  const hasFollowingLive = following.length > 0;

  const plannedEvents = planned
    .filter((e) => !mutedHosts.has(getHost(e)))
    .filter(followsHost);
  const endedEvents = ended.filter((e) => !mutedHosts.has(getHost(e)));

  return (
    <div className="homepage">
      {hasFollowingLive && (
        <div className="video-grid">
          {following.map((e) => (
            <VideoTile ev={e} key={e.id} />
          ))}
        </div>
      )}
      {!hasFollowingLive && (
        <div className="video-grid">
          {live
            .filter((e) => !mutedHosts.has(getHost(e)))
            .map((e) => (
              <VideoTile ev={e} key={e.id} />
            ))}
        </div>
      )}
      {hashtags.map((t) => (
        <>
          <h2 className="divider line one-line">#{t}</h2>
          <div className="video-grid">
            {live
              .filter((e) => !mutedHosts.has(getHost(e)))
              .filter((e) => {
                const evTags = getTagValues(e.tags, "t");
                return evTags.includes(t);
              })
              .map((e) => (
                <VideoTile ev={e} key={e.id} />
              ))}
          </div>
        </>
      ))}
      {hasFollowingLive && liveNow.length > 0 && (
        <>
          <h2 className="divider line one-line">Live</h2>
          <div className="video-grid">
            {liveNow
              .filter((e) => !mutedHosts.has(getHost(e)))
              .map((e) => (
                <VideoTile ev={e} key={e.id} />
              ))}
          </div>
        </>
      )}
      {plannedEvents.length > 0 && (
        <>
          <h2 className="divider line one-line">Planned</h2>
          <div className="video-grid">
            {plannedEvents.map((e) => (
              <VideoTile ev={e} key={e.id} />
            ))}
          </div>
        </>
      )}
      {endedEvents.length > 0 && (
        <>
          <h2 className="divider line one-line">Ended</h2>
          <div className="video-grid">
            {endedEvents.map((e) => (
              <VideoTile ev={e} key={e.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
