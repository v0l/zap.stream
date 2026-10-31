import { Mention } from "@/element/mention"
import type { BalanceHistoryResult, NostrStreamProvider } from "@/providers"
import { eventLink } from "@/utils"
import { EventKind, type NostrEvent, NostrLink } from "@snort/system"
import { useEffect, useState } from "react"
import { FormattedMessage, FormattedNumber } from "react-intl"
import { Link } from "react-router"
import Spinner from "@/element/spinner"
import { RelativeTime } from "@/element/relative-time"

export default function BalanceHistory({
  provider,
  limit,
  version,
}: {
  provider?: NostrStreamProvider
  limit?: number
  version?: number
}) {
  const [page] = useState(0)
  const [rows, setRows] = useState<BalanceHistoryResult>()

  useEffect(() => {
    if (!provider) return
    let cancelled = false
    provider
      .history(page, limit ?? 20)
      .then(r => {
        if (!cancelled) setRows(r)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [provider, page, limit, version])

  function eventDescription(ev: NostrEvent) {
    if (ev.kind === EventKind.LiveEvent) {
      return (
        <Link to={`/${eventLink(ev)}`} className="text-primary">
          <FormattedMessage defaultMessage="Past Stream" />
        </Link>
      )
    } else if (ev.kind === EventKind.ZapRequest) {
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <FormattedMessage defaultMessage="Zap from" />
            <Mention link={NostrLink.publicKey(ev.pubkey, "relays" in ev ? (ev.relays as Array<string>) : undefined)} />
          </div>
          {ev.content ? <q className="text-sm block">{ev.content}</q> : ""}
        </div>
      )
    }
  }

  if (!rows) return <Spinner />
  if (rows.items.length === 0) {
    return (
      <p className="text-sm text-layer-4">
        <FormattedMessage defaultMessage="No balance changes yet." />
      </p>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-layer-2">
      {rows.items.map(a => {
        let ev: NostrEvent | undefined
        if (a.desc?.startsWith("{")) {
          try {
            ev = JSON.parse(a.desc) as NostrEvent
          } catch {
            ev = undefined
          }
        }
        const credit = a.type === 0
        return (
          <li key={`${a.created}-${a.amount}-${a.type}`} className="flex items-start justify-between gap-3 py-2.5">
            <div className="flex flex-col min-w-0 text-sm">
              <div className="min-w-0 break-words">
                {ev ? eventDescription(ev) : a.desc || (credit ? <FormattedMessage defaultMessage="Topup" /> : null)}
              </div>
              <span className="text-xs text-layer-4">
                <RelativeTime from={a.created * 1000} suffix={true} />
              </span>
            </div>
            <span
              className={`text-sm font-semibold tabular-nums whitespace-nowrap ${credit ? "text-green-400" : "text-layer-5"}`}
            >
              {credit ? "+" : "-"}
              <FormattedNumber value={a.amount} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}
