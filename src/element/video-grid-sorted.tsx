import { useLogin } from "@/hooks/login";
import { useSortedStreams } from "@/hooks/useLiveStreams";
import { getTagValues, getHost } from "@/utils";
import { NostrEvent, TaggedNostrEvent } from "@snort/system";
import { ReactNode, useCallback, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import VideoGrid from "./video-grid";
import { VideoTile } from "./video-tile";

export default function VideoGridSorted({ evs, showAll }: { evs: Array<TaggedNostrEvent>; showAll?: boolean }) {
  const login = useLogin();
  const mutedHosts = new Set(getTagValues(login?.muted.tags ?? [], "p"));
  const tags = login?.follows.tags ?? [];
  const followsHost = useCallback(
    (ev: NostrEvent) => {
      return tags.find(t => t.at(1) === getHost(ev));
    },
    [tags],
  );
  const { live, planned, ended } = useSortedStreams(evs, showAll ? 0 : undefined);
  const hashtags = getTagValues(tags, "t");
  const following = live.filter(followsHost);
  const liveNow = live.filter(e => !following.includes(e));
  const hasFollowingLive = following.length > 0;

  const plannedEvents = planned.filter(e => !mutedHosts.has(getHost(e))).filter(followsHost);
  const endedEvents = ended.filter(e => !mutedHosts.has(getHost(e)));

  const liveByHashtag = useMemo(() => {
    return hashtags
      .map(t => ({
        tag: t,
        live: live
          .filter(e => !mutedHosts.has(getHost(e)))
          .filter(e => {
            const evTags = getTagValues(e.tags, "t");
            return evTags.includes(t);
          }),
      }))
      .filter(t => t.live.length > 0);
  }, [live, hashtags]);

  return (
    <div className="flex flex-col gap-6">
      {hasFollowingLive && (
        <GridSection header={<FormattedMessage defaultMessage="Following" id="cPIKU2" />} items={following} />
      )}
      {!hasFollowingLive && (
        <VideoGrid>
          {live
            .filter(e => !mutedHosts.has(getHost(e)))
            .map(e => (
              <VideoTile ev={e} key={e.id} />
            ))}
        </VideoGrid>
      )}
      {liveByHashtag.map(t => (
        <GridSection header={`#${t.tag}`} items={t.live} />
      ))}
      {hasFollowingLive && liveNow.length > 0 && (
        <GridSection header={<FormattedMessage defaultMessage="Live" id="Dn82AL" />} items={liveNow} />
      )}
      {plannedEvents.length > 0 && (
        <GridSection header={<FormattedMessage defaultMessage="Planned" id="kp0NPF" />} items={plannedEvents} />
      )}
      {endedEvents.length > 0 && (
        <GridSection header={<FormattedMessage defaultMessage="Ended" id="TP/cMX" />} items={endedEvents} />
      )}
    </div>
  );
}

function GridSection({ header, items }: { header: ReactNode; items: Array<TaggedNostrEvent> }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <h2 className="whitespace-nowrap">{header}</h2>
        <span className="h-[1px] bg-layer-1 w-full" />
      </div>
      <VideoGrid>
        {items.map(e => (
          <VideoTile ev={e} key={e.id} />
        ))}
      </VideoGrid>
    </>
  );
}
