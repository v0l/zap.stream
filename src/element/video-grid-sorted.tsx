import { useFollows, useMutedPubkeys } from "@/hooks/login"
import { useSortedStreams } from "@/hooks/useLiveStreams"
import { getTagValues, getHost, extractStreamInfo } from "@/utils"
import { type NostrEvent, NostrLink, type TaggedNostrEvent } from "@snort/system"
import { type ReactNode, useMemo } from "react"
import { FormattedMessage } from "react-intl"
import VideoGrid from "./video-grid"
import { StreamTile } from "./stream/stream-tile"
import { GameCard } from "./category/category-card"
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
  const muted = useMutedPubkeys()
  const follows = useFollows()
  const followsHost = (ev: NostrEvent) => follows.has(getHost(ev))

  const filteredStreams = evs.filter(a => !muted.has(getHost(a)))
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
    const grouped: Record<string, { gameId: string; viewers: number; live: number }> = {}
    for (const v of items) {
      const { gameId, participants, status } = extractStreamInfo(v)
      if (!gameId) continue
      grouped[gameId] ??= { gameId, viewers: 0, live: 0 }
      if (status === StreamState.Live) {
        grouped[gameId].live++
        grouped[gameId].viewers += Number(participants ?? 0) || 0
      }
    }
    return Object.values(grouped)
      .filter(a => a.live > 0)
      .sort((a, b) => b.viewers - a.viewers || b.live - a.live)
      .slice(0, 8)
  }, [items])

  if (categories.length === 0) return
  return (
    <>
      <SectionHeader>
        <FormattedMessage defaultMessage="Popular categories" />
      </SectionHeader>
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(150px,45%),1fr))]">
        {categories.map(a => (
          <GameCard key={a.gameId} id={a.gameId} live={a.live} viewers={a.viewers} />
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
