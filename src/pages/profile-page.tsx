import { useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router"
import { type CachedMetadata, type NostrEvent, NostrLink, type TaggedNostrEvent, RequestBuilder } from "@snort/system"
import { useUserProfile, useRequestBuilder } from "@snort/system-react"
import { FormattedMessage, FormattedNumber } from "react-intl"
import classNames from "classnames"

import { Icon } from "@/element/icon"
import { SendZapsDialog } from "@/element/send-zap"
import { StreamTile } from "@/element/stream/stream-tile"
import { FollowButton } from "@/element/follow-button"
import { MuteButton } from "@/element/mute-button"
import { useProfile } from "@/hooks/profile"
import { Text } from "@/element/text"
import { extractStreamInfo, findTag, safeMediaUrl } from "@/utils"
import { Avatar } from "@/element/avatar"
import { StreamState, VIDEO_KIND, OLD_VIDEO_KIND } from "@/const"
import { DefaultButton, PrimaryButton } from "@/element/buttons"
import { useGoals } from "@/hooks/goals"
import { Goal } from "@/element/goal"
import { useProfileClips } from "@/hooks/clips"
import VideoGrid from "@/element/video-grid"
import { ClipTile } from "@/element/stream/clip-tile"
import { VideoTile } from "@/element/video/video-tile"
import useImgProxy from "@/hooks/img-proxy"
import { useStreamLink } from "@/hooks/stream-link"
import useTopZappers from "@/hooks/top-zappers"
import { Profile, getName } from "@/element/profile"
import { formatSatsCompact } from "@/number"
import Logo from "@/element/logo"

type ProfileTab = "streams" | "videos" | "clips"

export function ProfilePage() {
  const link = useStreamLink()
  const { streams, zaps } = useProfile(link, true)
  const profile = useUserProfile(link?.id)
  const [tab, setTab] = useState<ProfileTab>("streams")

  const liveEvent = useMemo(() => streams.find(ev => findTag(ev, "status") === StreamState.Live), [streams])
  const pastStreams = useMemo(() => streams.filter(ev => findTag(ev, "status") === StreamState.Ended), [streams])
  const zapTotal = useMemo(() => zaps.reduce((acc, z) => acc + z.amount, 0), [zaps])

  if (!link) return
  return (
    <div className="flex flex-col min-w-0">
      <ProfileHero link={link} profile={profile} liveEvent={liveEvent} />
      <div className="px-4 sm:px-8 pb-16 flex flex-col gap-8 max-w-[1560px]">
        <ProfileStats streams={pastStreams.length} zapTotal={zapTotal} zappers={zaps} />
        {liveEvent && <LiveNow ev={liveEvent} />}
        <div className="grid gap-8 min-[1200px]:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-6 min-w-0">
            <ProfileTabs tab={tab} setTab={setTab} />
            {tab === "streams" && <ProfileStreamList streams={pastStreams} />}
            {tab === "videos" && <ProfileVideosSection link={link} />}
            {tab === "clips" && <ProfileClips link={link} />}
          </div>
          <aside className="flex flex-col gap-6">
            <ProfileTopZappers zaps={zaps} />
            <ProfileZapGoals link={link} />
          </aside>
        </div>
      </div>
    </div>
  )
}

function ProfileHero({
  profile,
  link,
  liveEvent,
}: {
  profile?: CachedMetadata
  link: NostrLink
  liveEvent?: NostrEvent
}) {
  const { proxy } = useImgProxy()
  const zapTarget = profile?.lud16 ?? profile?.lud06
  const name = getName(link.id, profile)
  const website = profile?.website?.replace(/^https?:\/\//, "").replace(/\/$/, "")
  const banner = safeMediaUrl(profile?.banner)

  return (
    <section className="relative">
      <div className="h-[180px] sm:h-[260px] bg-layer-1 overflow-hidden">
        {banner ? (
          <img className="w-full h-full object-cover" alt="" src={proxy(banner)} />
        ) : (
          <div className="w-full h-full bg-[radial-gradient(120%_120%_at_10%_100%,rgb(255_176_0/0.25),transparent_60%)]" />
        )}
        <div className="absolute inset-x-0 top-0 h-[180px] sm:h-[260px] bg-gradient-to-t from-layer-0 via-layer-0/20 to-transparent" />
      </div>
      <div className="relative -mt-16 sm:-mt-20 px-4 sm:px-8 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 max-w-[1560px]">
        <div className="relative w-fit">
          <Avatar
            user={profile}
            pubkey={link.id}
            size={132}
            className={classNames("border-4", liveEvent ? "border-primary" : "border-layer-0")}
          />
          {liveEvent && (
            <Link
              to={`/${NostrLink.fromEvent(liveEvent).encode()}`}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-primary px-2 py-0.5 text-sm font-bold"
            >
              <FormattedMessage defaultMessage="Live" id="Dn82AL" />
            </Link>
          )}
        </div>
        <div className="flex flex-col gap-2 min-w-0 flex-1 pb-1">
          <h1 className="text-[clamp(30px,4vw,48px)] leading-none break-words">{name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-layer-4">
            {profile?.nip05 && <span className="truncate">{profile.nip05.replace(/^_@/, "")}</span>}
            {website && (
              <a href={profile?.website} target="_blank" rel="noopener noreferrer" className="hover:text-text truncate">
                {website}
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center pb-1">
          {zapTarget && (
            <SendZapsDialog
              aTag={liveEvent ? NostrLink.fromEvent(liveEvent).tagKey : undefined}
              lnurl={zapTarget}
              pubkey={link.id}
              button={
                <PrimaryButton className="rounded-xl">
                  <Icon name="zap-filled" size={16} />
                  <FormattedMessage defaultMessage="Zap" id="fBI91o" />
                </PrimaryButton>
              }
              targetName={name}
            />
          )}
          <FollowButton pubkey={link.id} />
          <MuteButton pubkey={link.id} />
        </div>
      </div>
      {profile?.about && (
        <div className="px-4 sm:px-8 mt-4 max-w-[72ch] text-layer-5 whitespace-pre-line line-clamp-4">
          <Text content={profile.about} tags={[]} />
        </div>
      )}
    </section>
  )
}

function ProfileStats({
  streams,
  zapTotal,
  zappers,
}: {
  streams: number
  zapTotal: number
  zappers: ReturnType<typeof useProfile>["zaps"]
}) {
  const supporters = useMemo(() => new Set(zappers.map(z => (z.anonZap ? "anon" : z.sender))).size, [zappers])
  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-3 pt-6 border-b border-layer-3 pb-6">
      <Stat label={<FormattedMessage defaultMessage="Sats received" />}>
        <span className="text-primary">{formatSatsCompact(zapTotal)}</span>
      </Stat>
      <Stat label={<FormattedMessage defaultMessage="Supporters" />}>
        <FormattedNumber value={supporters} />
      </Stat>
      <Stat label={<FormattedMessage defaultMessage="Past streams" />}>
        <FormattedNumber value={streams} />
      </Stat>
    </dl>
  )
}

function Stat({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-sm text-layer-4">{label}</dt>
      <dd className="font-display text-3xl font-extrabold tabular-nums">{children}</dd>
    </div>
  )
}

function LiveNow({ ev }: { ev: TaggedNostrEvent }) {
  const { title, image, thumbnail, participants } = extractStreamInfo(ev)
  const { proxy } = useImgProxy()
  const img = safeMediaUrl(image) ?? safeMediaUrl(thumbnail)
  const [failed, setFailed] = useState(false)
  return (
    <Link
      to={`/${NostrLink.fromEvent(ev).encode()}`}
      state={ev}
      className="group flex flex-col sm:flex-row gap-4 sm:items-center rounded-2xl border border-primary/40 bg-primary/5 p-3 hover:bg-primary/10"
    >
      <div className="relative aspect-video sm:w-64 shrink-0 rounded-xl overflow-hidden bg-layer-1">
        {img && !failed ? (
          <img src={proxy(img)} alt="" className="w-full h-full object-cover" onError={() => setFailed(true)} />
        ) : (
          <Logo className="w-full h-full p-10 text-layer-3" />
        )}
      </div>
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_0_4px_rgb(255_176_0/0.22)]" />
          <FormattedMessage defaultMessage="Live now" />
        </span>
        <h2 className="text-2xl line-clamp-2">{title}</h2>
        {participants && (
          <span className="text-sm text-layer-4">
            <FormattedMessage defaultMessage="{n} watching" values={{ n: participants }} />
          </span>
        )}
      </div>
      <span className="shrink-0 rounded-xl bg-primary px-4 py-2.5 font-semibold text-center group-hover:brightness-110 sm:mr-2">
        <FormattedMessage defaultMessage="Watch stream" />
      </span>
    </Link>
  )
}

function ProfileTabs({ tab, setTab }: { tab: ProfileTab; setTab: (t: ProfileTab) => void }) {
  const tabs: Array<[ProfileTab, ReactNode]> = [
    ["streams", <FormattedMessage key="s" defaultMessage="Past streams" />],
    ["videos", <FormattedMessage key="v" defaultMessage="Videos" />],
    ["clips", <FormattedMessage key="c" defaultMessage="Clips" />],
  ]
  return (
    <div role="tablist" className="flex gap-6 border-b border-layer-3">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          onClick={() => setTab(id)}
          className={classNames(
            "pb-3 -mb-px font-medium border-b-2 cursor-pointer",
            tab === id ? "text-text border-primary" : "text-layer-4 border-transparent hover:text-text",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-layer-3 px-6 py-10 text-center text-layer-4">{children}</p>
  )
}

const STREAM_PAGE = 12

function ProfileStreamList({ streams }: { streams: Array<TaggedNostrEvent> }) {
  const [shown, setShown] = useState(STREAM_PAGE)
  if (streams.length === 0) {
    return (
      <EmptyState>
        <FormattedMessage defaultMessage="No past streams yet." />
      </EmptyState>
    )
  }
  return (
    <>
      <VideoGrid>
        {streams.slice(0, shown).map(ev => (
          <div key={ev.id} className="flex flex-col gap-1">
            <StreamTile ev={ev} showAuthor={false} showStatus={false} style="grid" />
            <span className="text-sm text-layer-4">
              <FormattedMessage
                defaultMessage="Streamed on {date}"
                values={{
                  date: new Date(ev.created_at * 1000).toLocaleDateString(),
                }}
              />
            </span>
          </div>
        ))}
      </VideoGrid>
      {shown < streams.length && (
        <DefaultButton className="self-center rounded-xl" onClick={() => setShown(n => n + STREAM_PAGE)}>
          <FormattedMessage
            defaultMessage="Show more ({n} left)"
            values={{ n: <FormattedNumber value={streams.length - shown} /> }}
          />
        </DefaultButton>
      )}
    </>
  )
}

function ProfileVideosSection({ link }: { link: NostrLink }) {
  const rb = useMemo(() => {
    const b = new RequestBuilder(`videos:${link.id}`)
    b.withFilter().kinds([VIDEO_KIND, OLD_VIDEO_KIND]).authors([link.id])
    return b
  }, [link.id])

  const videos = useRequestBuilder(rb)

  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => {
      const pubA = findTag(a, "published_at") ?? a.created_at
      const pubB = findTag(b, "published_at") ?? b.created_at
      return Number(pubA) > Number(pubB) ? -1 : 1
    })
  }, [videos])

  if (sortedVideos.length === 0) {
    return (
      <EmptyState>
        <FormattedMessage defaultMessage="No videos yet." />
      </EmptyState>
    )
  }

  return (
    <VideoGrid>
      {sortedVideos.map(ev => (
        <VideoTile ev={ev} key={ev.id} showAuthor={false} style="grid" />
      ))}
    </VideoGrid>
  )
}

function ProfileClips({ link }: { link: NostrLink }) {
  const clips = useProfileClips(link, 12)
  if (clips.length === 0) {
    return (
      <EmptyState>
        <FormattedMessage defaultMessage="No clips yet." />
      </EmptyState>
    )
  }
  return (
    <VideoGrid>
      {clips.map(a => (
        <ClipTile ev={a} key={a.id} />
      ))}
    </VideoGrid>
  )
}

function SidePanel({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-layer-3 bg-layer-1 overflow-hidden">
      <h2 className="font-sans text-[15px] font-semibold tracking-normal px-4 pt-4 pb-3 border-b border-layer-3">
        {title}
      </h2>
      {children}
    </section>
  )
}

function ProfileTopZappers({ zaps }: { zaps: ReturnType<typeof useProfile>["zaps"] }) {
  const zappers = useTopZappers(zaps)
  return (
    <SidePanel title={<FormattedMessage defaultMessage="Top supporters" />}>
      {zappers.length === 0 ? (
        <p className="px-4 py-4 text-sm text-layer-4">
          <FormattedMessage defaultMessage="No zaps yet." />
        </p>
      ) : (
        <ol>
          {zappers.slice(0, 10).map(({ pubkey, total }, i) => (
            <li key={pubkey} className="flex items-center gap-3 px-4 py-2.5 border-b border-layer-3 last:border-0">
              <span className="w-5 text-sm text-layer-4 tabular-nums">{i + 1}</span>
              <div className="flex-1 min-w-0 truncate">
                {pubkey === "anon" ? (
                  <span className="text-layer-5">
                    <FormattedMessage defaultMessage="Anon" id="bfvyfs" />
                  </span>
                ) : (
                  <Profile pubkey={pubkey} avatarSize={28} className="min-w-0" />
                )}
              </div>
              <span className="flex items-center gap-1 text-primary font-semibold tabular-nums">
                <Icon name="zap-filled" size={12} />
                {formatSatsCompact(total)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </SidePanel>
  )
}

function ProfileZapGoals({ link }: { link: NostrLink }) {
  const limit = 5
  const goals = useGoals(link.id, false, limit)
  if (goals.length === 0) return
  return (
    <SidePanel title={<FormattedMessage defaultMessage="Zap goals" />}>
      <div className="flex flex-col">
        {[...goals]
          .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
          .slice(0, limit)
          .map(a => (
            <div key={a.id} className="px-4 py-3 border-b border-layer-3 last:border-0">
              <Goal ev={a} confetti={false} />
            </div>
          ))}
      </div>
    </SidePanel>
  )
}
