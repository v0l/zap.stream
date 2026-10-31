import { useStreamsFeed } from "@/hooks/live-streams"
import VideoGridSorted from "@/element/video-grid-sorted"
import { useMutedPubkeys } from "@/hooks/login"
import { useSortedStreams } from "@/hooks/useLiveStreams"
import { useRecentStreamZaps } from "@/hooks/stream-zaps"
import { getHost } from "@/utils"
import { NostrLink } from "@snort/system"
import { useMemo } from "react"
import { FeaturedStream, pickFeaturedStream } from "@/element/featured-stream"
import { CategoryTabs } from "@/element/category/category-tabs"

export function RootPage() {
  const streams = useStreamsFeed()
  const muted = useMutedPubkeys()
  const visible = streams.filter(a => !muted.has(getHost(a)))
  const { live } = useSortedStreams(visible)
  const liveLinks = useMemo(() => live.map(a => NostrLink.fromEvent(a)), [live.map(a => a.id).join()])
  const { zaps, totals } = useRecentStreamZaps(liveLinks)
  const featured = pickFeaturedStream(live, totals)
  const featuredKey = featured ? NostrLink.fromEvent(featured).tagKey : undefined
  const featuredZaps = featured ? zaps.filter(z => z.targetEvents.some(t => t.tagKey === featuredKey)) : []

  return (
    <div className="flex flex-col p-4 sm:px-8 sm:py-7 min-w-0 grow max-w-[1560px]">
      {featured && featuredKey && <FeaturedStream ev={featured} zaps={featuredZaps} total={totals[featuredKey] ?? 0} />}
      <CategoryTabs className="mt-10 mb-6" />
      <VideoGridSorted evs={streams} showEnded={false} showPopular={true} showRecentClips={false} zapTotals={totals} />
    </div>
  )
}
