import { ExternalLink } from "@/element/external-link"
import StreamKey from "@/element/provider/nostr/stream-key"
import type { IngestEndpoint } from "@/providers"
import classNames from "classnames"
import { FormattedMessage, FormattedNumber } from "react-intl"
import { DashboardCard } from "./card"
import ManualStream from "./manual-stream"
import { endpointLabel, endpointTopQuality, satsPerHour } from "./quality"

export function DashboardGoLiveCard({
  endpoints,
  endpoint,
  setEndpoint,
}: {
  endpoints: Array<IngestEndpoint>
  endpoint?: IngestEndpoint
  setEndpoint: (ep: IngestEndpoint) => void
}) {
  const sorted = [...endpoints].sort((a, b) => satsPerHour(b) - satsPerHour(a))
  return (
    <DashboardCard title={<FormattedMessage defaultMessage="Go live" />}>
      <p className="text-layer-5 text-[15px]">
        <FormattedMessage
          defaultMessage="Paste the server URL and stream key into your streaming software, then start streaming. We recommend <a>OBS</a>."
          values={{
            a: c => <ExternalLink href="https://obsproject.com/">{c}</ExternalLink>,
          }}
        />
      </p>
      {sorted.length > 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-layer-4 pb-1.5">
            <FormattedMessage defaultMessage="Quality" />
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {sorted.map(ep => {
              const selected = ep.name === endpoint?.name
              const top = endpointTopQuality(ep)
              return (
                <label
                  key={ep.name}
                  className={classNames(
                    "flex flex-col gap-0.5 rounded-xl border px-3 py-2.5 cursor-pointer",
                    selected ? "border-primary bg-primary/10" : "border-layer-3 hover:border-layer-4",
                  )}
                >
                  <input
                    type="radio"
                    name="ingest-quality"
                    className="sr-only"
                    checked={selected}
                    onChange={() => setEndpoint(ep)}
                  />
                  <span className="font-semibold">
                    {endpointLabel(ep)}
                    {top && (
                      <span className="ml-1.5 text-sm font-normal text-layer-4">
                        {top === "source" ? <FormattedMessage defaultMessage="as sent" /> : top}
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-layer-5">
                    <FormattedMessage
                      defaultMessage="{sats} sats/hour"
                      values={{ sats: <FormattedNumber value={satsPerHour(ep)} maximumFractionDigits={1} /> }}
                    />
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      )}
      {endpoint && <StreamKey ep={endpoint} />}
      <div className="pt-1 border-t border-layer-3">
        <ManualStream />
      </div>
    </DashboardCard>
  )
}
