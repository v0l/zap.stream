import { NostrEvent } from "@snort/system";
import { useContext, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { SnortContext } from "@snort/system-react";

import { StreamProvider, StreamProviderEndpoint, StreamProviderInfo } from "@/providers";
import { SendZaps } from "./send-zap";
import { StreamEditor, StreamEditorProps } from "./stream-editor";
import Spinner from "./spinner";
import AsyncButton from "./async-button";

export function NostrProviderDialog({
  provider,
  showEndpoints,
  ...others
}: { provider: StreamProvider; showEndpoints: boolean } & StreamEditorProps) {
  const system = useContext(SnortContext);
  const [topup, setTopup] = useState(false);
  const [info, setInfo] = useState<StreamProviderInfo>();
  const [ep, setEndpoint] = useState<StreamProviderEndpoint>();
  const [tos, setTos] = useState(false);

  function sortEndpoints(arr: Array<StreamProviderEndpoint>) {
    return arr.sort((a, b) => ((a.rate ?? 0) > (b.rate ?? 0) ? -1 : 1));
  }

  useEffect(() => {
    provider.info().then(v => {
      setInfo(v);
      setTos(v.tosAccepted ?? true);
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
          getInvoice: async amount => {
            const pr = await provider.topup(amount);
            return { pr };
          },
        }}
        onFinish={() => {
          provider.info().then(v => {
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

  async function acceptTos() {
    await provider.acceptTos();
    const i = await provider.info();
    setInfo(i);
  }

  function tosInput() {
    if (!info) return;

    return (
      <>
        <div>
          <div className="flex gap-2">
            <input type="checkbox" checked={tos} onChange={e => setTos(e.target.checked)} />
            <p>
              <FormattedMessage
                defaultMessage="I have read and agree with {provider}'s {terms}."
                id="RJOmzk"
                values={{
                  provider: info.name,
                  terms: (
                    <span
                      className="tos-link"
                      onClick={() => window.open(info.tosLink, "popup", "width=400,height=800")}>
                      <FormattedMessage defaultMessage="terms and conditions" id="thsiMl" />
                    </span>
                  ),
                }}
              />
            </p>
          </div>
        </div>
        <div>
          <AsyncButton type="button" className="btn btn-primary wide" disabled={!tos} onClick={acceptTos}>
            <FormattedMessage defaultMessage="Continue" id="acrOoz" />
          </AsyncButton>
        </div>
      </>
    );
  }

  function streamEndpoints() {
    if (!info) return;
    return (
      <>
        {info.endpoints.length > 1 && (
          <div>
            <p>
              <FormattedMessage defaultMessage="Endpoint" id="ljmS5P" />
            </p>
            <div className="flex gap-2">
              {sortEndpoints(info.endpoints).map(a => (
                <span className={`pill${ep?.name === a.name ? " active" : ""}`} onClick={() => setEndpoint(a)}>
                  {a.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div>
          <p>
            <FormattedMessage defaultMessage="Server Url" id="5kx+2v" />
          </p>
          <div className="paper">
            <input type="text" value={ep?.url} disabled />
          </div>
        </div>
        <div>
          <p>
            <FormattedMessage defaultMessage="Stream Key" id="LknBsU" />
          </p>
          <div className="flex gap-2">
            <div className="paper grow">
              <input type="password" value={ep?.key} disabled />
            </div>
            <button className="btn btn-primary" onClick={() => window.navigator.clipboard.writeText(ep?.key ?? "")}>
              <FormattedMessage defaultMessage="Copy" id="4l6vz1" />
            </button>
          </div>
        </div>
        <div>
          <p>
            <FormattedMessage defaultMessage="Balance" id="H5+NAX" />
          </p>
          <div className="flex gap-2">
            <div className="paper grow">
              <FormattedMessage
                defaultMessage="{amount} sats"
                id="vrTOHJ"
                values={{ amount: info.balance?.toLocaleString() }}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setTopup(true)}>
              <FormattedMessage defaultMessage="Topup" id="nBCvvJ" />
            </button>
          </div>
          <small>
            <FormattedMessage defaultMessage="About {estimate}" id="Q3au2v" values={{ estimate: calcEstimate() }} />
          </small>
        </div>
        <div>
          <p>
            <FormattedMessage defaultMessage="Resolutions" id="4uI538" />
          </p>
          <div className="flex gap-2">
            {ep?.capabilities?.map(a => (
              <span className="pill">{parseCapability(a)}</span>
            ))}
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      {showEndpoints && streamEndpoints()}
      {info.tosAccepted === false ? (
        tosInput()
      ) : (
        <StreamEditor
          onFinish={ex => {
            provider.updateStreamInfo(system, ex);
            others.onFinish?.(ex);
          }}
          ev={
            {
              tags: [
                ["title", info.streamInfo?.title ?? ""],
                ["summary", info.streamInfo?.summary ?? ""],
                ["image", info.streamInfo?.image ?? ""],
                ...(info.streamInfo?.goal ? [["goal", info.streamInfo.goal]] : []),
                ...(info.streamInfo?.content_warning ? [["content-warning", info.streamInfo?.content_warning]] : []),
                ...(info.streamInfo?.tags?.map(a => ["t", a]) ?? []),
              ],
            } as NostrEvent
          }
          options={{
            canSetStream: false,
            canSetStatus: false,
          }}
        />
      )}
    </>
  );
}
