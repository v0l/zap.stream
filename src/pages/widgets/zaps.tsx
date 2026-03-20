import { useEffect, useMemo, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { memo } from 'react'

import { hexToBech32 } from '@snort/shared'
import { NostrLink, type ParsedZap } from '@snort/system'
import { useUserProfile } from '@snort/system-react'

import { useCurrentStreamFeed } from '@/hooks/current-stream-feed'
import { useZaps } from '@/hooks/zaps'
import { useMutedPubkeys } from '@/hooks/lists'
import { formatSats } from '@/number'
import { getVoices, speak, useTextToSpeechParams } from '@/text2speech'
import { getHost } from '@/utils'

function useZapQueue(zapStream: ParsedZap[], zapTime = 10_000) {
  const zaps = useMemo(() => {
    return [...zapStream].reverse()
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
  }, [zap])

  return zap
}

export const ZapAlerts = memo(function ZapAlerts({ link }: { link: NostrLink }) {
  const currentEvent = useCurrentStreamFeed(link, true)
  const currentLink = currentEvent ? NostrLink.fromEvent(currentEvent) : undefined
  const host = currentEvent ? getHost(currentEvent) : undefined
  const zaps = useZaps(currentLink, true)
  const zap = useZapQueue(zaps)
  const mutedPubkeys = useMutedPubkeys(host, true)
  const { voiceURI, minSats, volume } = useTextToSpeechParams()
  const voices = getVoices()
  const voice = useMemo(() => {
    return voices.find(v => v.voiceURI === voiceURI)
  }, [voices, voiceURI])

  useEffect(() => {
    if (!zap) return

    const senderLink = NostrLink.publicKey(zap?.sender ?? '')
    if (mutedPubkeys.some(a => a.equals(senderLink))) {
      return
    }

    const text = zap.content ?? ''
    if (text.length > 0 && voice) {
      try {
        if (zap.amount >= minSats) {
          speak(voice, text, volume)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [zap?.id])

  return (
    <div className="flex items-center flex-col gap-2 zap-alerts-widget">
      {zap && <ZapAlertItem key={zap.id} item={zap} />}
    </div>
  )
})

export const ZapAlertItem = memo(function ZapAlertItem({ item }: { item: ParsedZap }) {
  const profile = useUserProfile(item.sender)

  if (!profile) return

  return (
    <div className="zap-alert">
      <div className="zap-alert-title">
        <FormattedMessage defaultMessage="Incoming Zap" id="tG1ST3" />
      </div>
      <div className="zap-alert-header">
        <FormattedMessage
          defaultMessage="{name} with {amount}"
          id="Qe1MJu"
          values={{
            name: (
              <span className="highlight">
                {profile?.name ?? hexToBech32('npub', item?.sender ?? '').slice(0, 12)}&nbsp;
              </span>
            ),
            amount: <span className="highlight">&nbsp;{formatSats(item.amount)}</span>,
          }}
        />
      </div>
      {item.content && item.content.length > 0 && (
        <p dir="auto" className="zap-alert-body">
          {item.content}
        </p>
      )}
    </div>
  )
})
