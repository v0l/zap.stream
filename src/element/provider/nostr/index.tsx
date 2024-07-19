import { NostrEvent } from "@snort/system";
import { useContext, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { SnortContext } from "@snort/system-react";

import { NostrStreamProvider, StreamProviderEndpoint, StreamProviderInfo } from "@/providers";
import { SendZaps } from "@/element/send-zap";
import { StreamEditor, StreamEditorProps } from "@/element/stream-editor";
import Spinner from "@/element/spinner";
import { useRates } from "@/hooks/rates";
import { DefaultButton } from "@/element/buttons";
import Pill from "@/element/pill";
import { AddForwardInputs } from "./fowards";
import StreamKey from "./stream-key";
import AccountTopup from "./topup";
import AccountWithdrawl from "./withdraw";
import BalanceHistory from "./history";

export default function NostrProviderDialog({
  provider,
  showEndpoints,
  showEditor,
  showForwards,
  showBalanceHistory,
  ...others
}: {
  provider: NostrStreamProvider;
  showEndpoints: boolean;
  showEditor: boolean;
  showForwards: boolean;
  showBalanceHistory: boolean;
} & StreamEditorProps) {
  const system = useContext(SnortContext);
  const [topup, setTopup] = useState(false);
  const [info, setInfo] = useState<StreamProviderInfo>();
  const [ep, setEndpoint] = useState<StreamProviderEndpoint>();
  const [hrs, setHrs] = useState(25);
  const [tos, setTos] = useState(false);
  const rate = useRates("BTCUSD");

  function sortEndpoints(arr: Array<StreamProviderEndpoint>) {
    return arr.sort((a, b) => ((a.rate ?? 0) > (b.rate ?? 0) ? -1 : 1));
  }

  async function loadInfo() {
    const info = await provider.info();
    setInfo(info);
    setTos(info.tosAccepted ?? true);
    setEndpoint(sortEndpoints(info.endpoints)[0]);
  }
  useEffect(() => {
    loadInfo();
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
      const pm = hrs * 60 * ep.rate;
      return (
        <>
          {`${(raw / 60).toFixed(0)} hour @ ${ep.rate} sats/${ep.unit}`}
          &nbsp; or <br />
          {`${pm.toLocaleString()} sats/month ($${(rate.ask * pm * 1e-8).toFixed(2)}/mo) streaming ${hrs} hrs/month`}
          <div className="bg-layer-2 rounded-xl flex items-center px-2">
            Hrs
            <input type="number" value={hrs} onChange={e => setHrs(e.target.valueAsNumber)} />
          </div>
        </>
      );
    }
    return `${raw.toFixed(0)} ${ep.unit} @ ${ep.rate} sats/${ep.unit}`;
  }

  function parseCapability(cap: string) {
    const [tag, ...others] = cap.split(":");
    if (tag === "variant") {
      const [height] = others;
      return height === "source" ? "source" : `${height.slice(0, -1)}p`;
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
          <DefaultButton disabled={!tos} onClick={acceptTos}>
            <FormattedMessage defaultMessage="Continue" id="acrOoz" />
          </DefaultButton>
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
                <Pill selected={ep?.name === a.name} onClick={() => setEndpoint(a)}>
                  {a.name}
                </Pill>
              ))}
            </div>
          </div>
        )}
        {ep && <StreamKey ep={ep} />}
        <div>
          <p>
            <FormattedMessage defaultMessage="Balance" id="H5+NAX" />
          </p>
          <div className="flex gap-2">
            <div className="bg-layer-2 rounded-xl w-full flex items-center px-3">
              <FormattedMessage
                defaultMessage="{amount} sats"
                id="vrTOHJ"
                values={{ amount: info.balance?.toLocaleString() }}
              />
            </div>
            <AccountTopup provider={provider} onFinish={loadInfo} />
            <AccountWithdrawl provider={provider} onFinish={loadInfo} />
          </div>
          <small>
            <FormattedMessage defaultMessage="About {estimate}" id="Q3au2v" values={{ estimate: calcEstimate() }} />
          </small>
        </div>
        <div>
          <p className="pb-2">
            <FormattedMessage defaultMessage="Features" id="ZXp0z1" />
          </p>
          <div className="flex gap-2">{ep?.capabilities?.map(a => <Pill>{parseCapability(a)}</Pill>)}</div>
        </div>
      </>
    );
  }

  function streamEditor() {
    if (!info || !showEditor) return;
    if (info.tosAccepted === false) {
      return tosInput();
    }

    return (
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
    );
  }

  function forwardInputs() {
    if (!info || !showForwards) return;

    return (
      <div className="flex flex-col gap-4">
        <h3>
          <FormattedMessage defaultMessage="Stream Forwarding" id="W7DNWx" />
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {info.forwards?.map(a => (
            <>
              <div className="bg-layer-2 rounded-xl px-3 flex items-center">{a.name}</div>
              <DefaultButton
                onClick={async () => {
                  await provider.removeForward(a.id);
                  await loadInfo();
                }}>
                <FormattedMessage defaultMessage="Remove" id="G/yZLu" />
              </DefaultButton>
            </>
          ))}
        </div>
        <AddForwardInputs provider={provider} onAdd={loadInfo} />
      </div>
    );
  }

  function balanceHist() {
    if (!info || !showBalanceHistory) return;

    return (
      <div className="flex flex-col gap-4">
        <h3>
          <FormattedMessage defaultMessage="Balance History" />
        </h3>
        <div className="flex flex-col gap-1">
          <BalanceHistory provider={provider}/>
        </div>
      </div>
    );
  }

  return (
    <>
      {showEndpoints && streamEndpoints()}
      {streamEditor()}
      {forwardInputs()}
      {balanceHist()}
    </>
  );
}
