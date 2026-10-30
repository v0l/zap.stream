import { StreamState } from "@/const"
import { formatSats } from "@/number"
import { extractStreamInfo, getHost } from "@/utils"
import { youtubeThumbnailUrl } from "@/youtube"
import { NostrLink, type ParsedZap, type TaggedNostrEvent } from "@snort/system"
import { useUserProfile } from "@snort/system-react"
import classNames from "classnames"
import { useEffect, useRef, useState } from "react"
import HlsVideo from "hls-video-element/react"
import type { HlsVideoElement } from "hls-video-element"
import { useMediaQuery } from "usehooks-ts"
import { shouldReleasePlayer } from "./stream/release-player"
import { FormattedMessage } from "react-intl"
import { Link } from "react-router"
import { getName } from "./profile"

export function pickFeaturedStream(live: Array<TaggedNostrEvent>, zapTotals: Record<string, number>) {
  const candidates = live.filter(a => {
    const info = extractStreamInfo(a)
    return info.status === StreamState.Live && !info.contentWarning
  })
  const score = (ev: TaggedNostrEvent) => ({
    zaps: zapTotals[NostrLink.fromEvent(ev).tagKey] ?? 0,
    viewers: Number(extractStreamInfo(ev).participants ?? 0),
  })
  return candidates.sort((a, b) => {
    const sa = score(a)
    const sb = score(b)
    return sb.zaps - sa.zaps || sb.viewers - sa.viewers
  })[0]
}

export function FeaturedStream({ ev, zaps, total }: { ev: TaggedNostrEvent; zaps: Array<ParsedZap>; total: number }) {
  const { title, image, thumbnail, recording, participants, gameInfo, stream } = extractStreamInfo(ev)
  const host = getHost(ev)
  const hostProfile = useUserProfile(host)
  const link = `/${NostrLink.fromEvent(ev).encode()}`
  const imgSrc = image ?? thumbnail ?? (recording ? youtubeThumbnailUrl(recording) : undefined)

  return (
    <section
      className={classNames(
        "grid grid-cols-1 gap-5",
        zaps.length > 0 && "min-[1100px]:grid-cols-[minmax(0,1fr)_340px]",
      )}
    >
      <Link
        to={link}
        state={ev}
        className="group relative aspect-video max-sm:aspect-[4/3] max-h-[min(70vh,620px)] w-full rounded-2xl overflow-hidden bg-layer-1 isolate"
      >
        {imgSrc && <img src={imgSrc} alt="" className="absolute inset-0 w-full h-full object-cover -z-10" />}
        {stream?.toLowerCase().includes(".m3u8") && <FeaturedPreview src={stream} />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-layer-0/95 via-layer-0/30 to-transparent" />
        <div className="absolute inset-x-5 bottom-4 sm:inset-x-7 sm:bottom-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_0_4px_rgb(255_176_0/0.22)]" />
              <FormattedMessage defaultMessage="Live now" />
            </span>
            <h1 className="text-[clamp(26px,3.6vw,52px)] leading-[1.02] my-2 max-w-[20ch] line-clamp-3 [text-shadow:0_2px_24px_rgb(0_0_0/0.5)]">
              {title}
            </h1>
            <p className="flex flex-wrap gap-x-4 text-layer-5">
              <span>{getName(host, hostProfile)}</span>
              {gameInfo?.name && <span>{gameInfo.name}</span>}
              {participants && (
                <span>
                  <FormattedMessage defaultMessage="{n} watching" values={{ n: formatSats(Number(participants)) }} />
                </span>
              )}
            </p>
          </div>
          <span className="shrink-0 rounded-xl bg-primary px-4 py-2.5 font-semibold group-hover:brightness-110 max-sm:hidden">
            <FormattedMessage defaultMessage="Watch stream" />
          </span>
        </div>
      </Link>
      {zaps.length > 0 && <ZapFeed zaps={zaps} total={total} />}
    </section>
  )
}

function FeaturedPreview({ src }: { src: string }) {
  const ref = useRef<HlsVideoElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", { initializeWithValue: false })

  useEffect(() => {
    const el = ref.current
    return () => {
      queueMicrotask(() => {
        if (el && shouldReleasePlayer(el)) el.src = ""
      })
    }
  }, [src])

  if (reducedMotion) return null
  return (
    <HlsVideo
      ref={ref}
      src={src}
      muted
      autoplay
      playsInline
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setPlaying(true)}
      config={{ lowLatencyMode: true, capLevelToPlayerSize: true, maxBufferLength: 10 }}
      className={classNames(
        "absolute inset-0 w-full h-full object-cover -z-10 transition-opacity duration-700",
        playing ? "opacity-100" : "opacity-0",
      )}
    />
  )
}

function ZapFeed({ zaps, total }: { zaps: Array<ParsedZap>; total: number }) {
  return (
    <aside className="flex flex-col rounded-2xl border border-layer-3 bg-layer-1 overflow-hidden max-[1099px]:max-h-[340px] min-[1100px]:[contain:size]">
      <header className="px-[18px] pt-4 pb-3 border-b border-layer-3">
        <h2 className="font-sans text-[15px] font-semibold text-layer-4 tracking-normal">
          <FormattedMessage defaultMessage="Zapped in the last 24 hours" />
        </h2>
        <strong className="font-display text-[34px] leading-tight font-extrabold tabular-nums">
          {total.toLocaleString()}
          <small className="ml-1 text-base font-medium text-primary">
            <FormattedMessage defaultMessage="sats" />
          </small>
        </strong>
      </header>
      <ul className="flex-1 overflow-hidden">
        {zaps.slice(0, 12).map(z => (
          <ZapRow key={z.id} zap={z} />
        ))}
      </ul>
    </aside>
  )
}

function ZapRow({ zap }: { zap: ParsedZap }) {
  const sender = zap.anonZap ? undefined : zap.sender
  const profile = useUserProfile(sender)
  const seen = useRef(false)
  const [fresh, setFresh] = useState(false)

  useEffect(() => {
    if (seen.current) return
    seen.current = true
    if (Date.now() / 1000 - zap.created_at < 30) {
      setFresh(true)
      const t = setTimeout(() => setFresh(false), 4000)
      return () => clearTimeout(t)
    }
  }, [zap.created_at])

  return (
    <li
      className={classNames(
        "grid grid-cols-[1fr_auto] gap-x-3 px-[18px] py-[11px] border-b border-layer-3 transition-colors duration-1000",
        fresh ? "bg-primary/10 motion-safe:animate-[zap-land_0.5s_ease-out]" : "bg-transparent",
      )}
    >
      <b className="font-semibold truncate">
        {sender ? getName(sender, profile) : <FormattedMessage defaultMessage="Anon" />}
      </b>
      <span className="text-primary font-semibold tabular-nums">{zap.amount.toLocaleString()}</span>
      {zap.content && <q className="col-span-2 text-sm text-layer-4 truncate [quotes:none]">{zap.content}</q>}
    </li>
  )
}
