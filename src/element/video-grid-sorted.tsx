import { useLogin } from "@/hooks/login";
import { useSortedStreams } from "@/hooks/useLiveStreams";
import { getTagValues, getHost, extractStreamInfo } from "@/utils";
import { NostrEvent, TaggedNostrEvent } from "@snort/system";
import { ReactNode, useCallback, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import VideoGrid from "./video-grid";
import { VideoTile } from "./video-tile";
import { CategoryTile } from "./category/category-tile";
import { Link } from "react-router-dom";
import Pill from "./pill";
import { CategoryZaps } from "./category/zaps";
import { StreamState } from "@/const";

interface VideoGridSortedProps {
  evs: Array<TaggedNostrEvent>;
  showAll?: boolean;
  showEnded?: boolean;
  showPlanned?: boolean;
  showPopular?: boolean;
}

export default function VideoGridSorted({ evs, showAll, showEnded, showPlanned, showPopular }: VideoGridSortedProps) {
  const login = useLogin();
  const mutedHosts = new Set(getTagValues(login?.muted.tags ?? [], "p"));
  const tags = login?.follows.tags ?? [];
  const followsHost = useCallback(
    (ev: NostrEvent) => {
      return tags.find(t => t.at(1) === getHost(ev));
    },
    [tags]
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
      {showPopular && <PopularCategories items={evs} />}
      {hasFollowingLive && liveNow.length > 0 && (
        <GridSection header={<FormattedMessage defaultMessage="Live" id="Dn82AL" />} items={liveNow} />
      )}
      {plannedEvents.length > 0 && (showPlanned ?? true) && (
        <GridSection header={<FormattedMessage defaultMessage="Planned" id="kp0NPF" />} items={plannedEvents} />
      )}
      {endedEvents.length > 0 && (showEnded ?? true) && (
        <GridSection header={<FormattedMessage defaultMessage="Ended" id="TP/cMX" />} items={endedEvents} />
      )}
    </div>
  );
}

function GridSection({ header, items }: { header: ReactNode; items: Array<TaggedNostrEvent> }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <h3 className="whitespace-nowrap">{header}</h3>
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

function PopularCategories({ items }: { items: Array<TaggedNostrEvent> }) {
  const categories = useMemo(() => {
    const grouped = items.reduce(
      (acc, v) => {
        const { gameId, participants, status } = extractStreamInfo(v);
        if (gameId) {
          acc[gameId] ??= {
            gameId,
            viewers: 0,
            zaps: 0,
            streams: 0,
          };
          if (participants && status === StreamState.Live) {
            acc[gameId].viewers += Number(participants);
          }
          acc[gameId].streams++;
        }
        return acc;
      },
      {} as Record<
        string,
        {
          gameId: string;
          viewers: number;
          zaps: number;
          streams: number;
        }
      >
    );

    return Object.values(grouped)
      .sort((a, b) => (a.streams > b.streams ? -1 : 1))
      .slice(0, 8);
  }, [items]);

  return (
    <>
      <div className="flex items-center gap-4">
        <h3 className="whitespace-nowrap">
          <FormattedMessage defaultMessage="Popular" />
        </h3>
        <span className="h-[1px] bg-layer-1 w-full" />
      </div>
      <div className="flex flex-wrap gap-4">
        {categories.map(a => (
          <Link to={`/category/${a.gameId}`} className="xl:w-[180px] lg:w-[170px] max-lg:w-[calc(30dvw-1rem)]">
            <CategoryTile gameId={a.gameId} showFooterTitle={true}>
              <div className="flex gap-2">
                <CategoryZaps gameId={a.gameId} />
                {a.viewers > 0 && (
                  <Pill>
                    <FormattedMessage
                      defaultMessage="{n} viewers"
                      values={{
                        n: a.viewers,
                      }}
                    />
                  </Pill>
                )}
              </div>
            </CategoryTile>
          </Link>
        ))}
      </div>
    </>
  );
}
