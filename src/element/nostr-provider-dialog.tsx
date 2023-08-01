import { NostrEvent } from "@snort/system";
import {
  StreamProvider,
  StreamProviderEndpoint,
  StreamProviderInfo,
} from "providers";
import { useEffect, useState } from "react";
import { SendZaps } from "./send-zap";
import { StreamEditor, StreamEditorProps } from "./stream-editor";
import Spinner from "./spinner";
import { LIVE_STREAM } from "const";

const DummyEvent = {
  content: "",
  id: "",
  pubkey: "",
  sig: "",
  kind: LIVE_STREAM,
  created_at: 0,
  tags: [],
} as NostrEvent;

export function NostrProviderDialog({
  provider,
  ...others
}: { provider: StreamProvider } & StreamEditorProps) {
  const [topup, setTopup] = useState(false);
  const [info, setInfo] = useState<StreamProviderInfo>();
  const [ep, setEndpoint] = useState<StreamProviderEndpoint>();

  function sortEndpoints(arr: Array<StreamProviderEndpoint>) {
    return arr.sort((a, b) => ((a.rate ?? 0) > (b.rate ?? 0) ? -1 : 1));
  }

  useEffect(() => {
    provider.info().then((v) => {
      setInfo(v);
      setEndpoint(sortEndpoints(v.endpoints)[0]);
    });
  }, [provider]);

  if (!info) {
    return <Spinner />;
  }

  if (topup) {
    return (
      <SendZaps
        lnurl={{
          name: provider.name,
          canZap: false,
          maxCommentLength: 0,
          getInvoice: async (amount) => {
            const pr = await provider.topup(amount);
            return { pr };
          },
        }}
        onFinish={() => {
          provider.info().then((v) => {
            setInfo(v);
            setTopup(false);
          });
        }}
      />
    );
  }

  function calcEstimate() {
    if (!ep?.rate || !ep?.unit || !info?.balance || !info.balance) return;

    const raw = Math.max(0, info.balance / ep.rate);
    if (ep.unit === "min" && raw > 60) {
      return `${(raw / 60).toFixed(0)} hour @ ${ep.rate} sats/${ep.unit}`;
    }
    return `${raw.toFixed(0)} ${ep.unit} @ ${ep.rate} sats/${ep.unit}`;
  }

  function parseCapability(cap: string) {
    const [tag, ...others] = cap.split(":");
    if (tag === "variant") {
      const [height] = others;
      return height === "source" ? height : `${height.slice(0, -1)}p`;
    }
    if (tag === "output") {
      return others[0];
    }
    return cap;
  }

  const streamEvent = others.ev ?? info.publishedEvent ?? DummyEvent;
  return (
    <>
      {info.endpoints.length > 1 && (
        <div>
          <p>Endpoint</p>
          <div className="flex g12">
            {sortEndpoints(info.endpoints).map((a) => (
              <span
                className={`pill${ep?.name === a.name ? " active" : ""}`}
                onClick={() => setEndpoint(a)}
              >
                {a.name}
              </span>
            ))}
          </div>
        </div>
      )}
      <div>
        <p>Stream Url</p>
        <div className="paper">
          <input type="text" value={ep?.url} disabled />
        </div>
      </div>
      <div>
        <p>Stream Key</p>
        <div className="flex g12">
          <div className="paper f-grow">
            <input type="password" value={ep?.key} disabled />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => window.navigator.clipboard.writeText(ep?.key ?? "")}
          >
            Copy
          </button>
        </div>
      </div>
      <div>
        <p>Balance</p>
        <div className="flex g12">
          <div className="paper f-grow">
            {info.balance?.toLocaleString()} sats
          </div>
          <button className="btn btn-primary" onClick={() => setTopup(true)}>
            Topup
          </button>
        </div>
        <small>About {calcEstimate()}</small>
      </div>
      <div>
        <p>Resolutions</p>
        <div className="flex g12">
          {ep?.capabilities?.map((a) => (
            <span className="pill">{parseCapability(a)}</span>
          ))}
        </div>
      </div>
      {streamEvent && (
        <StreamEditor
          onFinish={(ex) => {
            provider.updateStreamInfo(ex);
            others.onFinish?.(ex);
          }}
          ev={streamEvent}
          options={{
            canSetStream: false,
            canSetStatus: false,
          }}
        />
      )}
    </>
  );
}
