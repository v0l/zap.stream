import { Avatar } from "@/element/avatar"
import { DefaultButton } from "@/element/buttons"
import { AllCategories } from "@/element/category/all-categories"
import { categoryStats } from "@/element/category/category-stats"
import { CategoryCard, GameCard } from "@/element/category/category-card"
import { CategoryTabs } from "@/element/category/category-tabs"
import { categoryQueryTags } from "@/element/category/category-tags"
import { Icon } from "@/element/icon"
import { getName } from "@/element/profile"
import { StreamTile } from "@/element/stream/stream-tile"
import VideoGrid from "@/element/video-grid"
import { useCategoryZaps } from "@/hooks/category-zaps"
import useGameInfo from "@/hooks/game-info"
import { useStreamsFeed } from "@/hooks/live-streams"
import { useMutedPubkeys } from "@/hooks/login"
import { useRecentStreamZaps } from "@/hooks/stream-zaps"
import { useSortedStreams } from "@/hooks/useLiveStreams"
import { formatSats, formatSatsCompact } from "@/number"
import { extractStreamInfo, getHost, profileLink } from "@/utils"
import { NostrLink, RequestBuilder, type TaggedNostrEvent } from "@snort/system"
import { useRequestBuilder, useUserProfile } from "@snort/system-react"
import classNames from "classnames"
import { type ReactNode, useMemo, useState } from "react"
import { FormattedMessage } from "react-intl"
import { Link, useParams } from "react-router"
import { LIVE_STREAM_KINDS } from "@/const"

const PAGE_SIZE = 12

export default function Category() {
  const { id } = useParams()
  return (
    <div className="flex flex-col p-4 sm:px-8 sm:py-7 min-w-0 grow max-w-[1560px]">
      {id ? <CategoryDetail id={id} key={id} /> : <CategoryIndex />}
    </div>
  )
}

function useCategoryStreams(tags: Array<string>) {
  const muted = useMutedPubkeys()
  const sub = useMemo(() => {
    const rb = new RequestBuilder(`category:${tags.join(",")}`)
    rb.withOptions({ leaveOpen: true })
    rb.withFilter().kinds(LIVE_STREAM_KINDS).tag("t", tags)
    return rb
  }, [tags.join(",")])
  const events = useRequestBuilder(sub)
  return events.filter(a => !muted.has(getHost(a)))
}

function CategoryIndex() {
  const muted = useMutedPubkeys()
  const streams = useStreamsFeed()
  const { live } = useSortedStreams(streams.filter(a => !muted.has(getHost(a))))
  const stats = useMemo(() => categoryStats(live.map(extractStreamInfo), AllCategories), [live.map(a => a.id).join()])

  return (
    <div className="flex flex-col gap-8">
      <h1>
        <FormattedMessage defaultMessage="Categories" />
      </h1>
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(160px,45%),1fr))]">
        {AllCategories.map(c => (
          <CategoryCard
            key={c.id}
            to={`/category/${c.id}`}
            name={c.name}
            cover={c.cover}
            className={c.className}
            live={stats.categories[c.id]?.live ?? 0}
            viewers={stats.categories[c.id]?.viewers ?? 0}
          />
        ))}
      </div>
      {stats.games.length > 0 && (
        <>
          <SectionHeader>
            <FormattedMessage defaultMessage="Games live now" />
          </SectionHeader>
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(160px,45%),1fr))]">
            {stats.games.map(g => (
              <GameCard key={g.id} id={g.id} live={g.live} viewers={g.viewers} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function CategoryDetail({ id }: { id: string }) {
  const tags = categoryQueryTags(id, AllCategories)
  const internal = AllCategories.find(a => a.id === id.replace(/^internal:/, ""))
  const game = useGameInfo(internal ? `internal:${internal.id}` : id)
  const events = useCategoryStreams(tags)
  const { live, ended } = useSortedStreams(events, 0)
  const liveLinks = useMemo(() => live.map(a => NostrLink.fromEvent(a)), [live.map(a => a.id).join()])
  const { totals } = useRecentStreamZaps(liveLinks)
  const viewers = live.reduce((acc, ev) => acc + (Number(extractStreamInfo(ev).participants ?? 0) || 0), 0)
  const cover = internal?.cover ?? game?.cover?.url

  return (
    <div className="flex flex-col gap-8">
      {internal && <CategoryTabs />}
      <header className="flex gap-5 sm:gap-7 items-end">
        <div className="shrink-0 w-[96px] sm:w-[140px] aspect-[3/4] rounded-xl overflow-hidden bg-layer-1">
          {cover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className={classNames("w-full h-full", internal?.className ?? game?.className)} />
          )}
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <h1 className="text-[clamp(28px,4vw,44px)]">{internal?.name ?? game?.name ?? id}</h1>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-layer-5">
            <span className="inline-flex items-center gap-2">
              {live.length > 0 && <span className="w-2 h-2 rounded-full bg-primary" />}
              <FormattedMessage defaultMessage="{n} live" values={{ n: live.length }} />
            </span>
            {viewers > 0 && (
              <span>
                <FormattedMessage defaultMessage="{n} watching" values={{ n: formatSats(viewers) }} />
              </span>
            )}
          </p>
          {game?.summary && <p className="text-layer-4 text-[15px] line-clamp-2 max-w-[70ch]">{game.summary}</p>}
        </div>
      </header>
      <TopStreamers id={id} />
      <section className="flex flex-col gap-5">
        <SectionHeader>
          <FormattedMessage defaultMessage="Live now" />
        </SectionHeader>
        {live.length > 0 ? (
          <VideoGrid>
            {live.map(e => (
              <StreamTile ev={e} key={e.id} style="grid" zapTotal={totals[NostrLink.fromEvent(e).tagKey]} />
            ))}
          </VideoGrid>
        ) : (
          <p className="text-layer-4">
            <FormattedMessage defaultMessage="Nobody is live here right now." />
          </p>
        )}
      </section>
      {ended.length > 0 && <PastStreams events={ended} />}
    </div>
  )
}

function PastStreams({ events }: { events: Array<TaggedNostrEvent> }) {
  const [shown, setShown] = useState(PAGE_SIZE)
  return (
    <section className="flex flex-col gap-5">
      <SectionHeader>
        <FormattedMessage defaultMessage="Past streams" />
      </SectionHeader>
      <VideoGrid>
        {events.slice(0, shown).map(e => (
          <StreamTile ev={e} key={e.id} style="grid" />
        ))}
      </VideoGrid>
      {events.length > shown && (
        <DefaultButton className="self-center" onClick={() => setShown(s => s + PAGE_SIZE * 2)}>
          <FormattedMessage defaultMessage="Show more" />
        </DefaultButton>
      )}
    </section>
  )
}

function TopStreamers({ id }: { id: string }) {
  const zaps = useCategoryZaps(id)
  const top = Object.entries(zaps.topPubkeys)
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
  if (top.length === 0) return
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-layer-4 font-sans">
        <Icon name="zap-filled" size={14} className="text-zap" />
        <FormattedMessage defaultMessage="Most zapped streamers" />
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hidden">
        {top.map(([pubkey, amount]) => (
          <TopStreamer key={pubkey} pubkey={pubkey} amount={amount} />
        ))}
      </div>
    </section>
  )
}

function TopStreamer({ pubkey, amount }: { pubkey: string; amount: number }) {
  const profile = useUserProfile(pubkey)
  return (
    <Link
      to={profileLink(profile, pubkey)}
      className="flex items-center gap-3 shrink-0 rounded-xl border border-layer-3 hover:border-layer-4 pl-2 pr-4 py-2"
    >
      <Avatar pubkey={pubkey} user={profile} size={36} />
      <span className="flex flex-col leading-tight">
        <span className="font-semibold max-w-[16ch] truncate">{getName(pubkey, profile)}</span>
        <span className="text-sm text-zap tabular-nums">
          <FormattedMessage defaultMessage="{n} sats" values={{ n: formatSatsCompact(amount) }} />
        </span>
      </span>
    </Link>
  )
}

function SectionHeader({ children }: { children: ReactNode }) {
  return <h2 className="text-[22px]">{children}</h2>
}
