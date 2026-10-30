import { Mention } from "@/element/mention"
import type { BalanceHistoryResult, NostrStreamProvider } from "@/providers"
import { eventLink } from "@/utils"
import { EventKind, type NostrEvent, NostrLink } from "@snort/system"
import { useEffect, useState } from "react"
import { FormattedMessage, FormattedNumber } from "react-intl"
import { Link } from "react-router"
import Spinner from "@/element/spinner"

export default function BalanceHistory({ provider }: { provider?: NostrStreamProvider }) {
  const [page] = useState(0)
  const [rows, setRows] = useState<BalanceHistoryResult>()

  useEffect(() => {
    if (!provider) return
    let cancelled = false
    provider
      .history(page)
      .then(r => {
        if (!cancelled) setRows(r)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [provider, page])

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
    <div className="overflow-x-auto rounded-xl border border-layer-2">
      <table className="w-full text-sm">
        <thead className="text-left text-layer-4">
          <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-medium">
            <th>
              <FormattedMessage defaultMessage="Time" />
            </th>
            <th>
              <FormattedMessage defaultMessage="Description" />
            </th>
            <th className="text-right">
              <FormattedMessage defaultMessage="Amount" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-layer-2 border-t border-layer-2">
          {rows.items.map(a => {
            let ev: NostrEvent | undefined
            if (a.desc?.startsWith("{")) {
              try {
                ev = JSON.parse(a.desc) as NostrEvent
              } catch {
                ev = undefined
              }
            }
            return (
              <tr key={`${a.created}-${a.amount}-${a.type}`} className="[&>td]:px-3 [&>td]:py-2 align-top">
                <td className="whitespace-nowrap text-layer-5">{new Date(a.created * 1000).toLocaleString()}</td>
                <td>{ev ? eventDescription(ev) : a.desc}</td>
                <td
                  className={`text-right tabular-nums whitespace-nowrap ${a.type === 0 ? "text-green-400" : "text-layer-5"}`}
                >
                  {a.type === 0 ? "+" : "-"}
                  <FormattedNumber value={a.amount} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
