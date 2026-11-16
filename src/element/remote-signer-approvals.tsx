import { useSyncExternalStore } from "react"
import { FormattedMessage, useIntl } from "react-intl"
import { RemoteApprovals } from "@/remote-approvals"

const EMPTY: ReturnType<typeof RemoteApprovals.snapshot> = []

export function RemoteSignerApprovals() {
  const { formatMessage } = useIntl()
  const approvals = useSyncExternalStore(
    c => RemoteApprovals.hook(c),
    () => RemoteApprovals.snapshot(),
    () => EMPTY,
  )
  if (!approvals.length) return null
  return (
    <aside
      aria-label={formatMessage({ id: "u3NgvA", defaultMessage: "Remote signer approval" })}
      className="fixed bottom-4 left-4 right-4 z-[60] sm:left-auto sm:max-w-md rounded-xl border border-layer-3 bg-layer-1 p-4 shadow-2xl"
    >
      <p role="status">
        <FormattedMessage id="bkm57L" defaultMessage="Your signer needs approval to continue." />
      </p>
      <ul className="flex flex-col gap-3 pt-3">
        {approvals.map(approval => (
          <li key={approval.id} className="flex flex-col gap-2">
            <a href={approval.url} target="_blank" rel="noopener noreferrer" className="text-primary break-all">
              <FormattedMessage id="wjVoKK" defaultMessage="Open your signer's approval page" /> —{" "}
              {new URL(approval.url).host}
            </a>
            <button type="button" onClick={approval.cancel} className="self-start">
              <FormattedMessage id="rCdjjL" defaultMessage="Cancel signer request" />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
