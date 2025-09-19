import BalanceTimeEstimate from "@/element/balance-time-estimate";
import { DefaultButton } from "@/element/buttons";
import { Icon } from "@/element/icon";
import { useRates } from "@/hooks/rates";
import { useStreamProvider } from "@/hooks/stream-provider";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, FormattedNumber } from "react-intl";
import { useNavigate } from "react-router-dom";
import ZapGlow from "../zap-glow";
import { AcceptTos } from "../tos";
import { AccountResponse } from "@/providers";

export default function DashboardIntro() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<AccountResponse>();
  const [tos, setTos] = useState<boolean>(false);
  const defaultSatsBalance = 1000;
  const exampleHours = 4;
  const { provider: streamProvider } = useStreamProvider();

  const defaultEndpoint = useMemo(() => {
    return info?.endpoints?.find(a => a.name == "Best") ?? info?.endpoints?.at(0);
  }, [info]);
  const rate = useRates("BTCUSD");
  const exampleCost = rate.ask * (exampleHours * (defaultEndpoint?.cost.rate ?? 0) * 60) * 1e-8;

  useEffect(() => {
    streamProvider.info().then(i => {
      setInfo(i);
      setTos(Boolean(i.tos?.accepted));
    });
  }, [streamProvider]);

  if (!defaultEndpoint) return;

  return (
    <div className="flex flex-col gap-4 mx-auto xl:w-1/3 lg:w-1/2 bg-layer-1 rounded-xl border border-layer-2 p-6">
      <h1>
        <FormattedMessage defaultMessage="Welcome to zap.stream!" />
      </h1>
      <div className="flex gap-4">
        <div>
          <ZapGlow />
        </div>
        <p className="text-layer-5">
          <FormattedMessage defaultMessage="ZapStream is a new kind of streaming platform that allows you to earn bitcoin (sats) the moment you start streaming! Viewers can tip streamers any amount they choose. The tips are instantly deposited to your bitcoin (lightning) wallet. zap.stream never touches your earnings!" />
        </p>
      </div>
      <h3>
        <FormattedMessage defaultMessage="Pricing" />
      </h3>
      <p className="text-layer-5">
        <FormattedMessage defaultMessage="zap.stream is an open source platform powered by the nostr protocol. There are no giant corporations or giant funds available to provide free streaming." />
      </p>
      <p className="text-layer-5">
        <FormattedMessage
          defaultMessage="Streamers pay a small fee to cover our running costs. We give new streamers a credit of {amount} sats (about {time_estimate} of streaming) to get started!"
          values={{
            amount: <FormattedNumber value={defaultSatsBalance} />,
            time_estimate: <BalanceTimeEstimate balance={defaultSatsBalance} endpoint={defaultEndpoint} />,
          }}
        />
      </p>
      <p>
        <FormattedMessage
          defaultMessage="Current stream cost: {amount} sats/{unit} (about {usd}/day for a {x}hr stream)"
          values={{
            amount: defaultEndpoint.cost.rate,
            unit: defaultEndpoint.cost.unit,
            x: exampleHours,
            usd: <FormattedNumber value={exampleCost} style="currency" currency="USD" />,
          }}
        />
      </p>
      {!info?.tos?.accepted && (
        <AcceptTos provider={streamProvider.name} tosLink={info?.tos?.link} tos={tos} setTos={setTos} />
      )}
      <DefaultButton
        disabled={!tos}
        onClick={async () => {
          if (!info?.tos?.accepted) {
            await streamProvider.acceptTos();
          }
          navigate("/dashboard/step-1");
        }}>
        <FormattedMessage defaultMessage="Create Stream" />
        <Icon name="signal" />
      </DefaultButton>
    </div>
  );
}
