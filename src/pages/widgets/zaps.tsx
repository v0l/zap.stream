import { useEffect, useMemo, useRef, useState } from "react"
import { FormattedMessage } from "react-intl"

import { NostrPrefix, unixNow } from "@snort/shared"
import { NostrLink, type ParsedZap, type ToNostrEventTag } from "@snort/system"
import { useUserProfile } from "@snort/system-react"

import { useCurrentStreamFeed } from "@/hooks/current-stream-feed"
import { useZaps } from "@/hooks/zaps"
import { useMutedPubkeys } from "@/hooks/lists"
import { formatSats } from "@/number"
import { pickVoice, speak, useTextToSpeechParams, useVoices } from "@/text2speech"
import { getHost } from "@/event-tags"
import { Avatar } from "@/element/avatar"
import { Icon } from "@/element/icon"
import { getName } from "@/element/profile-name"
import classNames from "classnames"

export function useZapQueue(zapStream: ParsedZap[], zapTime = 10_000) {
  const mountedAt = useRef(unixNow())
  const shown = useRef(new Set<string>())
  const [current, setCurrent] = useState<ParsedZap>()

  const next = useMemo(
    () =>
      zapStream
        .filter(a => a.created_at >= mountedAt.current && !shown.current.has(a.id))
        .sort((a, b) => a.created_at - b.created_at)
        .at(0),
    [zapStream, current],
  )

  useEffect(() => {
    if (current || !next) return
    shown.current.add(next.id)
    setCurrent(next)
  }, [current, next])

  useEffect(() => {
    if (!current) return
    const timeoutId = setTimeout(() => setCurrent(undefined), zapTime)
    return () => clearTimeout(timeoutId)
  }, [current, zapTime])

  return current
}

export function alertableZaps(zaps: Array<ParsedZap>, muted: Array<ToNostrEventTag>) {
  const mutedKeys = new Set(
    muted.filter((a): a is NostrLink => a instanceof NostrLink && a.type === NostrPrefix.PublicKey).map(a => a.id),
  )
  return zaps.filter(z => !z.sender || !mutedKeys.has(z.sender))
}

export function ZapAlerts({ link }: { link: NostrLink }) {
  const currentEvent = useCurrentStreamFeed(link, true)
  const currentLink = useMemo(() => (currentEvent ? NostrLink.fromEvent(currentEvent) : undefined), [currentEvent])
  const host = currentEvent ? getHost(currentEvent) : undefined
  const zaps = useZaps(currentLink, true)
  const mutedPubkeys = useMutedPubkeys(host, true)
  const visible = useMemo(() => alertableZaps(zaps, mutedPubkeys), [zaps, mutedPubkeys])
  const zap = useZapQueue(visible)
  const { voiceURI, minSats, volume } = useTextToSpeechParams(window.location.search)
  const voices = useVoices()
  const voice = useMemo(() => pickVoice(voices, voiceURI), [voices, voiceURI])
  const spokenId = useRef<string>(undefined)

  useEffect(() => {
    const text = zap?.content ?? ""
    if (!zap || !voice || spokenId.current === zap.id) return
    spokenId.current = zap.id
    if (text.length > 0 && zap.amount >= minSats) {
      speak(voice, text, volume)
    }
  }, [zap, voice, minSats, volume])

  return (
    <div className="flex flex-col items-center p-4">
      {zap && <ZapAlertItem key={zap.id} item={zap} className="animate-[zap-alert_10s_ease-in-out_both]" />}
    </div>
  )
}

export function ZapAlertItem({ item, className }: { item: ParsedZap; className?: string }) {
  const pubkey = item.anonZap || !item.sender ? "anon" : item.sender
  const profile = useUserProfile(pubkey === "anon" ? undefined : pubkey)
  const name = pubkey === "anon" ? <FormattedMessage defaultMessage="Anon" /> : getName(pubkey, profile)

  return (
    <div
      className={classNames(
        "inline-flex items-center gap-4 max-w-[560px] rounded-2xl border border-primary/40 bg-layer-1 pl-3 pr-6 py-3 shadow-[0_0_32px_rgb(255_176_0/0.18)]",
        className,
      )}
    >
      <Avatar pubkey={pubkey} user={profile} size={56} className="border-2 border-primary" />
      <div className="flex flex-col min-w-0">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
          <Icon name="zap-filled" size={14} />
          <FormattedMessage defaultMessage="Incoming zap" />
        </span>
        <span className="font-display text-2xl font-extrabold leading-tight break-words">
          <FormattedMessage
            defaultMessage="{name} zapped {amount}"
            values={{
              name,
              amount: (
                <span className="text-primary tabular-nums whitespace-nowrap">
                  <FormattedMessage defaultMessage="{n} sats" values={{ n: formatSats(item.amount) }} />
                </span>
              ),
            }}
          />
        </span>
        {item.content && item.content.length > 0 && (
          <p dir="auto" className="text-lg text-layer-5 break-words">
            {item.content}
          </p>
        )}
      </div>
    </div>
  )
}
