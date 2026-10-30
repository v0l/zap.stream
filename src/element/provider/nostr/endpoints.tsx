import type { AccountResponse, IngestEndpoint } from "@/providers"
import { FormattedMessage } from "react-intl"
import { sortEndpoints } from "./util"
import Pill from "@/element/pill"
import StreamKey from "./stream-key"
import CapabilityPill from "@/element/capability-pill"

export function StreamEndpoints({
  info,
  currentEndpoint,
  setEndpoint,
}: {
  info: AccountResponse
  currentEndpoint?: IngestEndpoint
  setEndpoint: (ep: IngestEndpoint) => void
}) {
  if (!info?.endpoints) return
  return (
    <div className="flex flex-col gap-3">
      {info.endpoints.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-layer-4">
            <FormattedMessage defaultMessage="Endpoint" id="ljmS5P" />
          </span>
          <div className="flex flex-wrap gap-2">
            {sortEndpoints(info.endpoints).map(a => (
              <Pill key={a.name} selected={currentEndpoint?.name === a.name} onClick={() => setEndpoint(a)}>
                {a.name}
              </Pill>
            ))}
          </div>
        </div>
      )}
      {currentEndpoint && <StreamKey ep={currentEndpoint} />}
      {(currentEndpoint?.capabilities?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-layer-4">
            <FormattedMessage defaultMessage="Features" id="ZXp0z1" />
          </span>
          <div className="flex flex-wrap gap-2">
            {currentEndpoint?.capabilities?.map(a => (
              <CapabilityPill key={a} capability={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
