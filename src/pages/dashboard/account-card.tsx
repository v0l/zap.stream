import BalanceTimeEstimate from "@/element/balance-time-estimate"
import AccountTopup from "@/element/provider/nostr/topup"
import type { AccountResponse, NostrStreamProvider } from "@/providers"
import type { TaggedNostrEvent } from "@snort/system"
import { useMemo } from "react"
import { FormattedMessage, FormattedNumber } from "react-intl"
import BalanceHistoryModal from "./balance-history"
import { DashboardSettingsButton } from "./button-settings"
import { DashboardCard } from "./card"
import ForwardingModal from "./forwarding"
import { ProviderSelectorButton } from "./provider-selector"

export function DashboardAccountCard({
  provider,
  info,
  ev,
  recording,
}: {
  provider: NostrStreamProvider
  info?: AccountResponse
  ev?: TaggedNostrEvent
  recording: boolean
}) {
  const endpoint = useMemo(() => {
    const name = recording ? "Best" : "Good"
    return info?.endpoints?.find(a => a.name === name) ?? info?.endpoints?.at(0)
  }, [info, recording])

  return (
    <DashboardCard
      title={<FormattedMessage defaultMessage="Account" />}
      headerAction={<span className="text-sm text-layer-4">{provider.name}</span>}
    >
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-sm text-layer-4">
            <FormattedMessage defaultMessage="Balance" />
          </span>
          <span className="font-display text-3xl font-extrabold tabular-nums">
            <FormattedNumber value={info?.balance ?? 0} />
            <small className="ml-1 text-base font-medium text-primary">
              <FormattedMessage defaultMessage="sats" />
            </small>
          </span>
          {endpoint && (
            <span className="text-sm text-layer-4">
              <FormattedMessage
                defaultMessage="About {estimate} of streaming"
                values={{ estimate: <BalanceTimeEstimate balance={info?.balance ?? 0} endpoint={endpoint} /> }}
              />
            </span>
          )}
        </div>
        <AccountTopup provider={provider} onFinish={() => {}} />
      </div>
      <div className="flex gap-2 flex-wrap pt-3 border-t border-layer-3">
        <BalanceHistoryModal provider={provider} />
        <ForwardingModal provider={provider} />
        <DashboardSettingsButton ev={ev} provider={provider} />
        <ProviderSelectorButton />
      </div>
    </DashboardCard>
  )
}
