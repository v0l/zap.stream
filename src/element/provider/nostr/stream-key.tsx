import Copy from "@/element/copy"
import type { IngestEndpoint } from "@/providers"
import type { ReactNode } from "react"
import { FormattedMessage } from "react-intl"

export default function StreamKey({ ep }: { ep: IngestEndpoint }) {
  return (
    <div className="flex flex-col gap-3">
      <KeyField label={<FormattedMessage defaultMessage="Server URL" />} value={ep.url} type="text" />
      <KeyField label={<FormattedMessage defaultMessage="Stream key" />} value={ep.key} type="password" />
    </div>
  )
}

function KeyField({ label, value, type }: { label: ReactNode; value: string; type: "text" | "password" }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-layer-4">{label}</span>
      <span className="flex items-center rounded-xl bg-layer-0 border border-layer-3 pr-3">
        <input
          type={type}
          value={value}
          readOnly
          className="reset flex-1 min-w-0 bg-transparent px-3 py-2 font-mono text-sm"
        />
        <Copy text={value} hideText={true} />
      </span>
    </label>
  )
}
