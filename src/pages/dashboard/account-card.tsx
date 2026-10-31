import AccountTopup from "@/element/provider/nostr/topup"
import AccountWithdrawl from "@/element/provider/nostr/withdraw"
import BalanceHistory from "@/element/provider/nostr/history"
import type { AccountResponse, IngestEndpoint, NostrStreamProvider } from "@/providers"
import { useState } from "react"
import { FormattedMessage, FormattedNumber } from "react-intl"
import { DashboardCard } from "./card"
import Modal from "@/element/modal"
import { endpointLabel, hoursOfStreaming } from "./quality"

export function DashboardWalletCard({
  provider,
  info,
  endpoint,
  onChange,
}: {
  provider: NostrStreamProvider
  info?: AccountResponse
  endpoint?: IngestEndpoint
  onChange: () => void
}) {
  const [showAll, setShowAll] = useState(false)
  const balance = info?.balance ?? 0
  const hours = endpoint ? hoursOfStreaming(balance, endpoint) : undefined
  const low = hours !== undefined && hours < 1

  return (
    <DashboardCard
      title={<FormattedMessage defaultMessage="Wallet" />}
      headerAction={<span className="text-sm text-layer-4">{provider.name}</span>}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col">
          <span className="font-display text-3xl font-extrabold tabular-nums">
            <FormattedNumber value={balance} />
            <small className="ml-1 text-base font-medium text-primary">
              <FormattedMessage defaultMessage="sats" />
            </small>
          </span>
          {endpoint && hours !== undefined && (
            <span className={low ? "text-sm text-warning" : "text-sm text-layer-4"}>
              <FormattedMessage
                defaultMessage="About {hours} hours of {quality} streaming"
                values={{
                  hours: <FormattedNumber value={hours} maximumFractionDigits={hours < 10 ? 1 : 0} />,
                  quality: endpointLabel(endpoint),
                }}
              />
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <AccountWithdrawl provider={provider} onFinish={onChange} />
          <AccountTopup provider={provider} onFinish={onChange} />
        </div>
      </div>
      <div className="flex flex-col pt-1 border-t border-layer-3">
        <div className="flex items-center justify-between pt-3">
          <span className="text-sm font-semibold text-layer-4">
            <FormattedMessage defaultMessage="Recent activity" />
          </span>
          <button type="button" className="text-sm text-primary cursor-pointer" onClick={() => setShowAll(true)}>
            <FormattedMessage defaultMessage="See all" />
          </button>
        </div>
        <BalanceHistory provider={provider} limit={4} version={balance} />
      </div>
      {showAll && (
        <Modal
          id="transactions"
          title={<FormattedMessage defaultMessage="Transactions" />}
          onClose={() => setShowAll(false)}
        >
          <BalanceHistory provider={provider} limit={50} version={balance} />
        </Modal>
      )}
    </DashboardCard>
  )
}
