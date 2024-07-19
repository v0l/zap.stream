import { BalanceHistoryResult, NostrStreamProvider } from "@/providers/zsz";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";

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
      {rows?.items.map(a => (
        <>
          <div>{new Date(a.created * 1000).toLocaleString()}</div>
          <div>{a.desc}</div>
          <div>
            {a.type === 0 ? "+" : "-"}
            {a.amount}
          </div>
        </>
      ))}
    </div>
  );
}
