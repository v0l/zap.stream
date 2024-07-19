import { BalanceHistoryResult, NostrStreamProvider } from "@/providers/zsz";
import { eventLink } from "@/utils";
import { NostrEvent } from "@snort/system";
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

  return (
    <div className="grid auto-rows-auto grid-cols-3 gap-1">
      <div>
        <FormattedMessage defaultMessage="Time" />
      </div>
      <div>
        <FormattedMessage defaultMessage="Description" />
      </div>
      <div>
        <FormattedMessage defaultMessage="Amount" />
      </div>
      {rows?.items.map(a => {
        let ev: NostrEvent | undefined;
        if (a.desc && a.desc.startsWith("{")) {
          ev = JSON.parse(a.desc) as NostrEvent;
        }
        return (
          <>
            <div>{new Date(a.created * 1000).toLocaleString()}</div>
            <div>
              {ev ? (
                <Link to={`/${eventLink(ev)}`} className="text-primary">
                  <FormattedMessage defaultMessage="Past Stream" />
                </Link>
              ) : (
                a.desc
              )}
            </div>
            <div>
              {a.type === 0 ? "+" : "-"}
              <FormattedNumber value={a.amount} />
            </div>
          </>
        );
      })}
    </div>
  );
}
