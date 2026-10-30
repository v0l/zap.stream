import { ChatZap } from "@/element/chat/live-chat"
import { useMemo } from "react"
import { FormattedMessage, FormattedNumber } from "react-intl"
import { DashboardCard } from "./card"
import { DashboardHighlightZap } from "./zap-highlight"
import { ShareMenu } from "@/element/share-menu"
import { useRates } from "@/hooks/rates"
import { useStream } from "@/element/stream/stream-state"

export function DashboardZapColumn() {
  const { event, reactions } = useStream()
  const sortedZaps = useMemo(
    () => [...reactions.zaps].sort((a, b) => (b.created_at > a.created_at ? 1 : -1)),
    [reactions.zaps],
  )
  const latestZap = sortedZaps.at(0)
  const zapSum = sortedZaps.reduce((acc, v) => acc + v.amount, 0)
  const rate = useRates("BTCUSD")
  const usdValue = rate.ask ? zapSum * 1e-8 * rate.ask : 0

  return (
    <div className="flex flex-col gap-5 min-h-0">
      <DashboardCard
        title={<FormattedMessage defaultMessage="Earned this stream" />}
        headerAction={event && <ShareMenu ev={event} />}
      >
        <div className="flex flex-col">
          <span className="font-display text-4xl font-extrabold tabular-nums">
            <FormattedNumber value={zapSum} />
            <small className="ml-1.5 text-base font-medium text-primary">
              <FormattedMessage defaultMessage="sats" />
            </small>
          </span>
          <span className="text-sm text-layer-4">
            {Number.isFinite(rate.ask) && rate.ask > 0 && (
              <>
                <FormattedNumber value={usdValue} style="currency" currency="USD" />
                {", "}
              </>
            )}
            <FormattedMessage defaultMessage="{n} zaps" values={{ n: <FormattedNumber value={sortedZaps.length} /> }} />
          </span>
        </div>
      </DashboardCard>
      <DashboardCard
        className="xl:flex-1 min-h-[160px]"
        bodyClassName="overflow-y-auto flex-1"
        title={<FormattedMessage defaultMessage="Zaps" />}
      >
        {latestZap ? (
          <>
            <DashboardHighlightZap zap={latestZap} />
            {sortedZaps.slice(1).map(a => (
              <ChatZap key={a.id} zap={a} />
            ))}
          </>
        ) : (
          <p className="text-layer-4">
            <FormattedMessage defaultMessage="Zaps from viewers will show up here." />
          </p>
        )}
      </DashboardCard>
    </div>
  )
}
