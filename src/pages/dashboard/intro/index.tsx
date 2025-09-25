import { DefaultButton } from "@/element/buttons";
import { Icon } from "@/element/icon";
import CapabilityPill from "@/element/capability-pill";
import { useRates } from "@/hooks/rates";
import { useStreamProvider } from "@/hooks/stream-provider";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, FormattedNumber } from "react-intl";
import { useNavigate } from "react-router-dom";
import ZapGlow from "../zap-glow";
import { AcceptTos } from "../tos";
import { AccountResponse } from "@/providers";
import { ProviderSelectorButton } from "../provider-selector";

export default function DashboardIntro() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<AccountResponse>();
  const [tos, setTos] = useState<boolean>(false);
  const exampleHours = 4;
  const { provider: streamProvider } = useStreamProvider();

  const defaultEndpoint = useMemo(() => {
    return info?.endpoints?.find(a => a.name == "Best") ?? info?.endpoints?.at(0);
  }, [info]);
  const rate = useRates("BTCUSD");

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
        <FormattedMessage defaultMessage="Provider Endpoint Costs" />
      </h3>
      <p className="text-layer-5">
        <FormattedMessage defaultMessage="Your current provider offers different streaming endpoints with varying costs and capabilities." />
      </p>
      <div className="space-y-3">
        {info?.endpoints?.map(endpoint => {
          const endpointCost = rate.ask * (exampleHours * endpoint.cost.rate * 60) * 1e-8;
          return (
            <div key={endpoint.name} className="border border-layer-2 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-white">{endpoint.name}</h4>
                  <p className="text-sm text-layer-5">
                    <FormattedMessage
                      defaultMessage="{rate} sats/{unit}"
                      values={{
                        rate: endpoint.cost.rate,
                        unit: endpoint.cost.unit,
                      }}
                    />
                  </p>
                  <p className="text-xs text-layer-6">
                    <FormattedMessage
                      defaultMessage="~{cost}/day for {hours}hr stream"
                      values={{
                        cost: <FormattedNumber value={endpointCost} style="currency" currency="USD" />,
                        hours: exampleHours,
                      }}
                    />
                  </p>
                  {endpoint.capabilities?.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {endpoint.capabilities.map(capability => (
                          <CapabilityPill key={capability} capability={capability} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pt-3 border-t border-layer-2">
        <ProviderSelectorButton />
      </div>
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
