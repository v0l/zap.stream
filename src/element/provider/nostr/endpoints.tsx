import { AccountResponse, IngestEndpoint } from "@/providers";
import { FormattedMessage } from "react-intl";
import { sortEndpoints } from "./util";
import Pill from "@/element/pill";
import StreamKey from "./stream-key";
import CapabilityPill from "@/element/capability-pill";

export function StreamEndpoints({
  info,
  currentEndpoint,
  setEndpoint,
}: {
  info: AccountResponse;
  currentEndpoint?: IngestEndpoint;
  setEndpoint: (ep: IngestEndpoint) => void;
}) {
  if (!info?.endpoints) return;
  return (
    <>
      {info.endpoints.length > 1 && (
        <div>
          <p>
            <FormattedMessage defaultMessage="Endpoint" id="ljmS5P" />
          </p>
          <div className="flex gap-2">
            {sortEndpoints(info.endpoints).map(a => (
              <Pill selected={currentEndpoint?.name === a.name} onClick={() => setEndpoint(a)}>
                {a.name}
              </Pill>
            ))}
          </div>
        </div>
      )}
      {currentEndpoint && <StreamKey ep={currentEndpoint} />}
      <div>
        <p className="pb-2">
          <FormattedMessage defaultMessage="Features" id="ZXp0z1" />
        </p>
        <div className="flex gap-2">{currentEndpoint?.capabilities?.map(a => <CapabilityPill capability={a} />)}</div>
      </div>
    </>
  );
}
