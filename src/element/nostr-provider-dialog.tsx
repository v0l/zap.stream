import { NostrEvent } from "@snort/system";
import { StreamProvider, StreamProviderEndpoint, StreamProviderInfo } from "providers";
import { useContext, useEffect, useState } from "react";
import { SendZaps } from "./send-zap";
import { StreamEditor, StreamEditorProps } from "./stream-editor";
import Spinner from "./spinner";
import AsyncButton from "./async-button";
import { FormattedMessage } from "react-intl";
import { SnortContext } from "@snort/system-react";

export function NostrProviderDialog({ provider, ...others }: { provider: StreamProvider } & StreamEditorProps) {
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
          <div className="flex g12">
            <input type="checkbox" checked={tos} onChange={e => setTos(e.target.checked)} />
            <p>
              <FormattedMessage
                defaultMessage="I have read and agree with {provider}'s {terms}."
                values={{
                  provider: info.name,
                  terms: (
                    <span
                      className="tos-link"
                      onClick={() => window.open(info.tosLink, "popup", "width=400,height=800")}>
                      <FormattedMessage defaultMessage="terms and conditions" />
                    </span>
                  ),
                }}
              />
            </p>
          </div>
        </div>
        <div>
          <AsyncButton type="button" className="btn btn-primary wide" disabled={!tos} onClick={acceptTos}>
            <FormattedMessage defaultMessage="Continue" />
          </AsyncButton>
        </div>
      </>
    );
  }

  return (
    <>
      {info.endpoints.length > 1 && (
        <div>
          <p>
            <FormattedMessage defaultMessage="Endpoint" />
          </p>
          <div className="flex g12">
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
          <FormattedMessage defaultMessage="Server Url" />
        </p>
        <div className="paper">
          <input type="text" value={ep?.url} disabled />
        </div>
      </div>
      <div>
        <p>
          <FormattedMessage defaultMessage="Stream Key" />
        </p>
        <div className="flex g12">
          <div className="paper f-grow">
            <input type="password" value={ep?.key} disabled />
          </div>
          <button className="btn btn-primary" onClick={() => window.navigator.clipboard.writeText(ep?.key ?? "")}>
            <FormattedMessage defaultMessage="Copy" />
          </button>
        </div>
      </div>
      <div>
        <p>
          <FormattedMessage defaultMessage="Balance" />
        </p>
        <div className="flex g12">
          <div className="paper f-grow">
            <FormattedMessage defaultMessage="{amount} sats" values={{ amount: info.balance?.toLocaleString() }} />
          </div>
          <button className="btn btn-primary" onClick={() => setTopup(true)}>
            <FormattedMessage defaultMessage="Topup" />
          </button>
        </div>
        <small>
          <FormattedMessage defaultMessage="About {estimate}" values={{ estimate: calcEstimate() }} />
        </small>
      </div>
      <div>
        <p>
          <FormattedMessage defaultMessage="Resolutions" />
        </p>
        <div className="flex g12">
          {ep?.capabilities?.map(a => (
            <span className="pill">{parseCapability(a)}</span>
          ))}
        </div>
      </div>
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
