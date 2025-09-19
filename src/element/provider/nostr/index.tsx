import { useContext, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { SnortContext } from "@snort/system-react";

import { AccountResponse, IngestEndpoint, NostrStreamProvider } from "@/providers";
import { SendZaps } from "@/element/send-zap";
import { StreamEditor, StreamEditorProps } from "@/element/stream-editor";
import Spinner from "@/element/spinner";
import { useRates } from "@/hooks/rates";
import { DefaultButton } from "@/element/buttons";
import { AddForwardInputs } from "./fowards";
import AccountTopup from "./topup";
import AccountWithdrawl from "./withdraw";
import BalanceHistory from "./history";
import StreamKeyList from "./stream-keys";
import NwcConfig from "./nwc-config";
import { sortEndpoints } from "./util";
import { StreamEndpoints } from "./endpoints";

export default function NostrProviderDialog({
  provider,
  showEndpoints,
  showEditor,
  showBalance,
  showEstimate,
  showForwards,
  showBalanceHistory,
  showStreamKeys,
  showNwc,
  ...others
}: {
  provider: NostrStreamProvider;
  showEndpoints: boolean;
  showBalance?: boolean;
  showEstimate?: boolean;
  showEditor: boolean;
  showForwards: boolean;
  showBalanceHistory: boolean;
  showStreamKeys: boolean;
  showNwc?: boolean;
} & StreamEditorProps) {
  const system = useContext(SnortContext);
  const [topup, setTopup] = useState(false);
  const [info, setInfo] = useState<AccountResponse>();
  const [ep, setEndpoint] = useState<IngestEndpoint>();
  const [hrs, setHrs] = useState(25);
  const [tos, setTos] = useState(false);
  const rate = useRates("BTCUSD");

  async function loadInfo() {
    const info = await provider.info();
    setInfo(info);
    setTos(info.tos?.accepted ?? true);
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
    if (!ep?.cost.rate || !ep?.cost.unit || !info?.balance || !info.balance) return;

    const raw = Math.max(0, info.balance / ep.cost.rate);
    if (ep.cost.unit === "min" && raw > 60) {
      const pm = hrs * 60 * ep.cost.rate;
      return (
        <>
          {`${(raw / 60).toFixed(0)} hour @ ${ep.cost.rate} sats/${ep.cost.unit}`}
          &nbsp; or <br />
          {`${pm.toLocaleString()} sats/month ($${(rate.ask * pm * 1e-8).toFixed(2)}/mo) streaming ${hrs} hrs/month`}
          <div className="bg-layer-2 rounded-xl flex items-center px-2">
            Hrs
            <input type="number" value={hrs} onChange={e => setHrs(e.target.valueAsNumber)} />
          </div>
        </>
      );
    }
    return `${raw.toFixed(0)} ${ep.cost.unit} @ ${ep.cost.rate} sats/${ep.cost.unit}`;
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
                  provider: provider.name,
                  terms: (
                    <span
                      className="tos-link"
                      onClick={() => window.open(info.tos?.link, "popup", "width=400,height=800")}>
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

  function currentBalance() {
    if (!info) return;
    return (
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
      </div>
    );
  }

  function balanceTimeEstimate() {
    if (!info) return;
    return (
      <div>
        <small>
          <FormattedMessage defaultMessage="About {estimate}" values={{ estimate: calcEstimate() }} />
        </small>
      </div>
    );
  }

  function streamEditor() {
    if (!info || !showEditor) return;
    if (info.tos?.accepted === false) {
      return tosInput();
    }

    return (
      <StreamEditor
        onFinish={ex => {
          provider.updateStreamInfo(system, ex);
          others.onFinish?.(ex);
        }}
        ev={others.ev}
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
          <BalanceHistory provider={provider} />
        </div>
      </div>
    );
  }

  function streamKeys() {
    if (!info || !showStreamKeys) return;
    return <StreamKeyList provider={provider} />;
  }

  function nwcConfig() {
    if (!info || !showNwc || info.has_nwc === undefined) return;
    return <NwcConfig provider={provider} hasNwc={info.has_nwc} onConfigured={loadInfo} />;
  }

  return (
    <>
      {showEndpoints && <StreamEndpoints currentEndpoint={ep} info={info} setEndpoint={setEndpoint} />}
      {showBalance && currentBalance()}
      {showEstimate && balanceTimeEstimate()}
      {streamEditor()}
      {nwcConfig()}
      {forwardInputs()}
      {balanceHist()}
      {streamKeys()}
    </>
  );
}
