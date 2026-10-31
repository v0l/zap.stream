import { useEffect, useMemo, useRef, useState } from "react"
import { FormattedMessage } from "react-intl"

import { unixNow } from "@snort/shared"
import { NostrLink, type ParsedZap } from "@snort/system"
import { useUserProfile } from "@snort/system-react"

import { useCurrentStreamFeed } from "@/hooks/current-stream-feed"
import { useZaps } from "@/hooks/zaps"
import { useMutedPubkeys } from "@/hooks/lists"
import { formatSats } from "@/number"
import { speak, useTextToSpeechParams, useVoices } from "@/text2speech"
import { getHost } from "@/utils"
import { Avatar } from "@/element/avatar"
import { Icon } from "@/element/icon"
import { getName } from "@/element/profile"
import classNames from "classnames"

function useZapQueue(zapStream: ParsedZap[], zapTime = 10_000) {
  const mountedAt = useRef(unixNow())
  const zaps = useMemo(() => {
    return zapStream.filter(a => a.created_at >= mountedAt.current).reverse()
  }, [zapStream])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const zap = useMemo(() => {
    return zaps.at(currentIndex)
  }, [zaps, currentIndex])

  useEffect(() => {
    if (zap) {
      const timeoutId = setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
      }, zapTime)
      return () => clearTimeout(timeoutId)
    }
  }, [zap, zapTime])

  return zap
}

export function ZapAlerts({ link }: { link: NostrLink }) {
  const currentEvent = useCurrentStreamFeed(link, true)
  const currentLink = currentEvent ? NostrLink.fromEvent(currentEvent) : undefined
  const host = currentEvent ? getHost(currentEvent) : undefined
  const zaps = useZaps(currentLink, true)
  const zap = useZapQueue(zaps)
  const mutedPubkeys = useMutedPubkeys(host, true)
  const { voiceURI, minSats, volume } = useTextToSpeechParams()
  const voices = useVoices()
  const spokenId = useRef<string>(undefined)
  const voice = useMemo(() => {
    return voices.find(v => v.voiceURI === voiceURI)
  }, [voices, voiceURI])

  useEffect(() => {
    if (!zap || spokenId.current === zap.id) return

    const senderLink = NostrLink.publicKey(zap?.sender ?? "")
    if (mutedPubkeys.some(a => a.equals(senderLink))) {
      spokenId.current = zap.id
      return
    }

    const text = zap.content ?? ""
    if (text.length === 0) {
      spokenId.current = zap.id
      return
    }
    if (voice) {
      spokenId.current = zap.id
      try {
        if (zap.amount >= minSats) {
          speak(voice, text, volume)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [zap, voice, minSats, volume, mutedPubkeys])

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
