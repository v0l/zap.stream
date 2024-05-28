import { useLogin } from "@/hooks/login";
import { useSortedStreams } from "@/hooks/useLiveStreams";
import { getTagValues, getHost, extractStreamInfo } from "@/utils";
import { NostrEvent, NostrLink, TaggedNostrEvent } from "@snort/system";
import { ReactNode, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import VideoGrid from "./video-grid";
import { StreamTile } from "./stream/stream-tile";
import { CategoryTile } from "./category/category-tile";
import { Link } from "react-router-dom";
import Pill from "./pill";
import { CategoryZaps } from "./category/zaps";
import { StreamState, VIDEO_KIND } from "@/const";
import { useRecentClips } from "@/hooks/clips";
import { ClipTile } from "./stream/clip-tile";

interface VideoGridSortedProps {
  evs: Array<TaggedNostrEvent>;
  showAll?: boolean;
  showEnded?: boolean;
  showPlanned?: boolean;
  showPopular?: boolean;
  showRecentClips?: boolean;
  showVideos?: boolean;
}

export default function VideoGridSorted({
  evs,
  showAll,
  showEnded,
  showPlanned,
  showPopular,
  showRecentClips,
  showVideos,
}: VideoGridSortedProps) {
  const login = useLogin();
  const mutedHosts = login?.state?.muted ?? [];
  const follows = login?.state?.follows ?? [];
  const followsHost = (ev: NostrEvent) => follows?.includes(getHost(ev));

  const filteredStreams = evs.filter(a => !mutedHosts.includes(NostrLink.publicKey(getHost(a))));
  const { live, planned, ended } = useSortedStreams(filteredStreams, showAll ? 0 : undefined);
  const hashtags: Array<string> = [];
  const following = live.filter(followsHost);
  const liveNow = live.filter(e => !following.includes(e));
  const hasFollowingLive = following.length > 0;

  const plannedEvents = planned.filter(followsHost);

  const liveByHashtag = useMemo(() => {
    return hashtags
      .map(t => ({
        tag: t,
        live: live.filter(e => {
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
          {live.map(e => (
            <StreamTile ev={e} key={e.id} style="grid" />
          ))}
        </VideoGrid>
      )}
      {liveByHashtag.map(t => (
        <GridSection header={`#${t.tag}`} items={t.live} />
      ))}
      {showPopular && <PopularCategories items={evs} />}
      {showVideos && (
        <GridSection
          header={<FormattedMessage defaultMessage="Videos" />}
          items={evs.filter(a => a.kind === VIDEO_KIND)}
        />
      )}
      {showRecentClips && <RecentClips />}
      {hasFollowingLive && liveNow.length > 0 && (
        <GridSection header={<FormattedMessage defaultMessage="Live" id="Dn82AL" />} items={liveNow} />
      )}
      {plannedEvents.length > 0 && (showPlanned ?? true) && (
        <GridSection header={<FormattedMessage defaultMessage="Planned" id="kp0NPF" />} items={plannedEvents} />
      )}
      {ended.length > 0 && (showEnded ?? true) && (
        <GridSection header={<FormattedMessage defaultMessage="Ended" id="TP/cMX" />} items={ended} />
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
          <StreamTile ev={e} key={e.id} style="grid" />
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
      >,
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
          <Link
            key={a.gameId}
            to={`/category/${a.gameId}`}
            className="xl:w-[180px] lg:w-[170px] max-lg:w-[calc(33.3%-0.75rem)]">
            <CategoryTile gameId={a.gameId} showFooterTitle={true}>
              <div className="flex gap-2 flex-wrap">
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

function RecentClips() {
  const clips = useRecentClips();

  return (
    <>
      <div className="flex items-center gap-4">
        <h3 className="whitespace-nowrap">
          <FormattedMessage defaultMessage="Recent Clips" />
        </h3>
        <span className="h-[1px] bg-layer-1 w-full" />
      </div>
      <VideoGrid>
        {clips.slice(0, 5).map(a => (
          <ClipTile ev={a} key={a.id} />
        ))}
      </VideoGrid>
    </>
  );
}
