import { useLogin } from "@/hooks/login"
import { useSortedStreams } from "@/hooks/useLiveStreams"
import { getTagValues, getHost, extractStreamInfo } from "@/utils"
import { type NostrEvent, NostrLink, type TaggedNostrEvent } from "@snort/system"
import { type ReactNode, useMemo } from "react"
import { FormattedMessage } from "react-intl"
import VideoGrid from "./video-grid"
import { StreamTile } from "./stream/stream-tile"
import { CategoryTile } from "./category/category-tile"
import { Link } from "react-router"
import Pill from "./pill"
import { StreamState, VIDEO_KIND } from "@/const"
import { useRecentClips } from "@/hooks/clips"
import { ClipTile } from "./stream/clip-tile"

interface VideoGridSortedProps {
  evs: Array<TaggedNostrEvent>
  showAll?: boolean
  showEnded?: boolean
  showPlanned?: boolean
  showPopular?: boolean
  showRecentClips?: boolean
  showVideos?: boolean
  zapTotals?: Record<string, number>
}

export default function VideoGridSorted({
  evs,
  showAll,
  showEnded,
  showPlanned,
  showPopular,
  showRecentClips,
  showVideos,
  zapTotals,
}: VideoGridSortedProps) {
  const login = useLogin()
  const mutedHosts = login?.state?.muted ?? []
  const follows = login?.state?.follows ?? []
  const followsHost = (ev: NostrEvent) => follows?.includes(getHost(ev))

  const filteredStreams = evs.filter(a => {
    const hostLink = NostrLink.publicKey(getHost(a))
    return !mutedHosts.some(b => b.equals(hostLink))
  })
  const { live, planned, ended } = useSortedStreams(filteredStreams, showAll ? 0 : undefined)
  const hashtags: Array<string> = []
  const following = live.filter(followsHost)
  const liveNow = live.filter(e => !following.includes(e))
  const hasFollowingLive = following.length > 0

  const plannedEvents = planned.filter(followsHost)

  const liveByHashtag = useMemo(() => {
    return hashtags
      .map(t => ({
        tag: t,
        live: live.filter(e => {
          const evTags = getTagValues(e.tags, "t")
          return evTags.includes(t)
        }),
      }))
      .filter(t => t.live.length > 0)
  }, [live, hashtags])

  const videos = evs.filter(a => a.kind === VIDEO_KIND)
  return (
    <div className="flex flex-col gap-6">
      {hasFollowingLive && (
        <GridSection
          header={<FormattedMessage defaultMessage="Following" id="cPIKU2" />}
          items={following}
          zapTotals={zapTotals}
        />
      )}
      {!hasFollowingLive && (
        <VideoGrid>
          {live.map(e => (
            <StreamTile ev={e} key={e.id} style="grid" zapTotal={zapTotals?.[NostrLink.fromEvent(e).tagKey]} />
          ))}
        </VideoGrid>
      )}
      {liveByHashtag.map(t => (
        <GridSection key={t.tag} header={`#${t.tag}`} items={t.live} />
      ))}
      {showVideos && videos.length > 0 && (
        <GridSection header={<FormattedMessage defaultMessage="Videos" />} items={videos} />
      )}
      {showRecentClips && <RecentClips />}
      {hasFollowingLive && liveNow.length > 0 && (
        <GridSection
          header={<FormattedMessage defaultMessage="Live" id="Dn82AL" />}
          items={liveNow}
          zapTotals={zapTotals}
        />
      )}
      {showPopular && <PopularCategories items={evs} />}
      {plannedEvents.length > 0 && (showPlanned ?? true) && (
        <GridSection header={<FormattedMessage defaultMessage="Planned" id="kp0NPF" />} items={plannedEvents} />
      )}
      {ended.length > 0 && (showEnded ?? true) && (
        <GridSection header={<FormattedMessage defaultMessage="Ended" id="TP/cMX" />} items={ended} />
      )}
    </div>
  )
}

function GridSection({
  header,
  items,
  zapTotals,
}: {
  header: ReactNode
  items: Array<TaggedNostrEvent>
  zapTotals?: Record<string, number>
}) {
  return (
    <>
      <SectionHeader>{header}</SectionHeader>
      <VideoGrid>
        {items.map(e => (
          <StreamTile ev={e} key={e.id} style="grid" zapTotal={zapTotals?.[NostrLink.fromEvent(e).tagKey]} />
        ))}
      </VideoGrid>
    </>
  )
}

function PopularCategories({ items }: { items: Array<TaggedNostrEvent> }) {
  const categories = useMemo(() => {
    const grouped = items.reduce(
      (acc, v) => {
        const { gameId, participants, status } = extractStreamInfo(v)
        if (gameId) {
          acc[gameId] ??= {
            gameId,
            viewers: 0,
            zaps: 0,
            streams: 0,
          }
          if (participants && status === StreamState.Live) {
            acc[gameId].viewers += Number(participants)
          }
          acc[gameId].streams++
        }
        return acc
      },
      {} as Record<
        string,
        {
          gameId: string
          viewers: number
          zaps: number
          streams: number
        }
      >,
    )

    return Object.values(grouped)
      .sort((a, b) => (a.streams > b.streams ? -1 : 1))
      .slice(0, 8)
  }, [items])

  return (
    <>
      <SectionHeader>
        <FormattedMessage defaultMessage="Popular" />
      </SectionHeader>
      <div className="flex flex-wrap gap-4">
        {categories.map(a => (
          <Link
            key={a.gameId}
            to={`/category/${a.gameId}`}
            className="xl:w-[180px] lg:w-[170px] max-lg:w-[calc(33.3%-0.75rem)]"
          >
            <CategoryTile gameId={a.gameId} showFooterTitle={true}>
              <div className="flex gap-2 flex-wrap">
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
  )
}

function RecentClips() {
  const clips = useRecentClips()

  return (
    <>
      <SectionHeader>
        <FormattedMessage defaultMessage="Recent Clips" />
      </SectionHeader>
      <VideoGrid>
        {clips.slice(0, 5).map(a => (
          <ClipTile ev={a} key={a.id} />
        ))}
      </VideoGrid>
    </>
  )
}

function SectionHeader({ children }: { children: ReactNode }) {
  return <h2 className="text-[22px] pt-4">{children}</h2>
}
