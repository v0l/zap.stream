import { NostrLink, TaggedNostrEvent } from "@snort/system";
import { unixNow } from "@snort/shared";

import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { useStatus } from "@/hooks/status";
import { findTag, getHost } from "@/utils";

export function Music({ link }: { link: NostrLink }) {
  const currentEvent = useCurrentStreamFeed(link, true);
  if (!currentEvent) return;
  return <MusicWidget ev={currentEvent} />;
}

function MusicWidget({ ev }: { ev: TaggedNostrEvent }) {
  const host = getHost(ev);
  const nowPlaying = useStatus("music", host, true);
  const cover = nowPlaying && findTag(nowPlaying, "cover");
  const expiry = nowPlaying && findTag(nowPlaying, "expiration");
  const isExpired = expiry && Number(expiry) < unixNow();
  return (
    nowPlaying &&
    !isExpired && (
      <div className="music">
        {cover && <img className="cover" src={cover} alt={nowPlaying.content} />}
        {nowPlaying && <p className="track">🎵 {nowPlaying.content}</p>}
      </div>
    )
  );
}
