import { useStreamsFeed } from "@/hooks/live-streams"
import VideoGridSorted from "@/element/video-grid-sorted"
import { AllCategories } from "./category"
import { Link, useLocation } from "react-router"
import { useLogin } from "@/hooks/login"
import { useSortedStreams } from "@/hooks/useLiveStreams"
import { useRecentStreamZaps } from "@/hooks/stream-zaps"
import { getHost } from "@/utils"
import { NostrLink } from "@snort/system"
import { useMemo } from "react"
import { FeaturedStream, pickFeaturedStream } from "@/element/featured-stream"
import { FormattedMessage } from "react-intl"
import classNames from "classnames"

export function RootPage() {
  const streams = useStreamsFeed()
  const login = useLogin()
  const muted = login?.state?.muted ?? []
  const visible = streams.filter(a => {
    const host = NostrLink.publicKey(getHost(a))
    return !muted.some(b => b.equals(host))
  })
  const { live } = useSortedStreams(visible)
  const liveLinks = useMemo(() => live.map(a => NostrLink.fromEvent(a)), [live.map(a => a.id).join()])
  const { zaps, totals } = useRecentStreamZaps(liveLinks)
  const featured = pickFeaturedStream(live, totals)
  const featuredKey = featured ? NostrLink.fromEvent(featured).tagKey : undefined
  const featuredZaps = featured ? zaps.filter(z => z.targetEvents.some(t => t.tagKey === featuredKey)) : []

  return (
    <div className="flex flex-col p-4 sm:px-8 sm:py-7 min-w-0 grow max-w-[1560px]">
      {featured && featuredKey && <FeaturedStream ev={featured} zaps={featuredZaps} total={totals[featuredKey] ?? 0} />}
      <CategoryTabs />
      <VideoGridSorted evs={streams} showEnded={false} showPopular={true} showRecentClips={false} zapTotals={totals} />
    </div>
  )
}

function CategoryTabs() {
  const location = useLocation()
  const tabs = [
    { to: "/", name: <FormattedMessage defaultMessage="All live" /> },
    ...AllCategories.filter(a => a.priority === 0).map(a => ({ to: `/category/${a.id}`, name: a.name })),
  ]
  return (
    <nav className="flex gap-6 mt-10 mb-6 border-b border-layer-3 overflow-x-auto scrollbar-hidden">
      {tabs.map(t => {
        const active = location.pathname === t.to || (t.to === "/" && location.pathname === "/streams")
        return (
          <Link
            key={t.to}
            to={t.to}
            aria-current={active ? "page" : undefined}
            className={classNames(
              "pb-3 -mb-px whitespace-nowrap font-medium border-b-2",
              active ? "text-text border-primary" : "text-layer-4 border-transparent hover:text-text",
            )}
          >
            {t.name}
          </Link>
        )
      })}
    </nav>
  )
}
