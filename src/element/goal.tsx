import { useMemo } from "react"
import Confetti from "react-confetti"
import { FormattedMessage } from "react-intl"

import { type NostrEvent, NostrLink } from "@snort/system"
import { useUserProfile } from "@snort/system-react"

import { findTag } from "@/utils"
import { formatSats } from "@/number"
import usePreviousValue from "@/hooks/usePreviousValue"
import { SendZapsDialog } from "./send-zap"
import { getName } from "./profile"
import { useZaps } from "@/hooks/zaps"

export function Goal({ ev, confetti }: { ev: NostrEvent; confetti?: boolean }) {
  const profile = useUserProfile(ev.pubkey)
  const zapTarget = profile?.lud16 ?? profile?.lud06
  const link = NostrLink.fromEvent(ev)
  const zaps = useZaps(link, true)
  const goalAmount = useMemo(() => {
    const amount = findTag(ev, "amount")
    return amount ? Number(amount) / 1000 : null
  }, [ev])

  const soFar = useMemo(() => {
    return zaps
      .filter(z => z.receiver === ev.pubkey && z.targetEvents.some(a => a.matchesEvent(ev)))
      .reduce((acc, z) => acc + z.amount, 0)
  }, [zaps])

  const progress = goalAmount ? Math.max(0, Math.min(100, (soFar / goalAmount) * 100)) : 0
  const isFinished = progress >= 100
  const previousValue = usePreviousValue(isFinished)

  if (!goalAmount) {
    return null
  }

  const goalContent = (
    <div className="flex flex-col gap-2 cursor-pointer text-left w-full">
      {ev.content.length > 0 && <p className="font-medium">{ev.content}</p>}
      <div
        className="h-2 rounded-full bg-layer-3 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div className="h-full rounded-full bg-zap" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex justify-between text-xs text-layer-4 tabular-nums">
        <span className="text-primary font-semibold">
          <FormattedMessage defaultMessage="{amount} sats" values={{ amount: formatSats(soFar) }} />
        </span>
        <FormattedMessage defaultMessage="Goal: {amount}" id="QceMQZ" values={{ amount: formatSats(goalAmount) }} />
      </div>
      {isFinished && previousValue === false && (confetti ?? true) && (
        <Confetti numberOfPieces={2100} recycle={false} />
      )}
    </div>
  )

  return zapTarget ? (
    <SendZapsDialog
      lnurl={zapTarget}
      pubkey={ev.pubkey}
      eTag={ev?.id}
      targetName={getName(ev.pubkey, profile)}
      button={goalContent}
    />
  ) : (
    goalContent
  )
}
