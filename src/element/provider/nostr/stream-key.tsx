import { CopyField } from "@/element/copy-field"
import type { IngestEndpoint } from "@/providers"
import { FormattedMessage } from "react-intl"

export default function StreamKey({ ep }: { ep: IngestEndpoint }) {
  return (
    <div className="flex flex-col gap-3">
      <CopyField label={<FormattedMessage defaultMessage="Server URL" />} value={ep.url} />
      <CopyField label={<FormattedMessage defaultMessage="Stream key" />} value={ep.key} secret={true} />
    </div>
  )
}
