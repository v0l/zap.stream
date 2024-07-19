import { Mention } from "@/element/mention";
import { BalanceHistoryResult, NostrStreamProvider } from "@/providers/zsz";
import { eventLink } from "@/utils";
import { EventKind, NostrEvent } from "@snort/system";
import { useEffect, useState } from "react";
import { FormattedMessage, FormattedNumber } from "react-intl";
import { Link } from "react-router-dom";

export default function BalanceHistory({ provider }: { provider?: NostrStreamProvider }) {
  const [page] = useState(0);
  const [rows, setRows] = useState<BalanceHistoryResult>();

  useEffect(() => {
    if (!provider) return;
    provider.history(page).then(setRows);
  }, []);

  function eventDescription(ev: NostrEvent) {
    if (ev.kind === EventKind.LiveEvent) {
      return (
        <Link to={`/${eventLink(ev)}`} className="text-primary">
          <FormattedMessage defaultMessage="Past Stream" />
        </Link>
      );
    } else if (ev.kind === EventKind.ZapRequest) {
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <FormattedMessage defaultMessage="Zap from" />
            <Mention pubkey={ev.pubkey} />
          </div>
          {ev.content ? <q className="text-sm block">{ev.content}</q> : ""}
        </div>
      );
    }
  }

  return (
    <table className="table-auto border-collapse">
      <thead>
        <tr>
          <th>
            <FormattedMessage defaultMessage="Time" />
          </th>
          <th>
            <FormattedMessage defaultMessage="Description" />
          </th>
          <th>
            <FormattedMessage defaultMessage="Amount" />
          </th>
        </tr>
      </thead>
      <tbody>
        {rows?.items.map(a => {
          let ev: NostrEvent | undefined;
          if (a.desc && a.desc.startsWith("{")) {
            ev = JSON.parse(a.desc) as NostrEvent;
          }
          return (
            <tr>
              <td>{new Date(a.created * 1000).toLocaleString()}</td>
              <td>{ev ? eventDescription(ev) : a.desc}</td>
              <td className={a.type === 0 ? "text-green-400" : "text-red-400"}>
                {a.type === 0 ? "+" : "-"}
                <FormattedNumber value={a.amount} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
