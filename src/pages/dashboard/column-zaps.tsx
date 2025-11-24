import { ChatZap } from "@/element/chat/live-chat";
import { useMemo } from "react";
import { FormattedMessage, FormattedNumber } from "react-intl";
import { DashboardCard } from "./card";
import { DashboardHighlightZap } from "./zap-highlight";
import ZapGlow from "./zap-glow";
import { ShareMenu } from "@/element/share-menu";
import { useRates } from "@/hooks/rates";
import { useStream } from "@/element/stream/stream-state";

export function DashboardZapColumn() {
  const { event, reactions } = useStream();
  const sortedZaps = useMemo(
    () => reactions.zaps.sort((a, b) => (b.created_at > a.created_at ? 1 : -1)),
    [reactions.zaps],
  );
  const latestZap = sortedZaps.at(0);
  const zapSum = sortedZaps.reduce((acc, v) => acc + v.amount, 0);
  const rate = useRates("BTCUSD");
  const usdValue = rate.ask ? zapSum * 1e-8 * rate.ask : 0;

  return (
    <div className="flex flex-col gap-2">
      <DashboardCard className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <ZapGlow />
            <h3>
              <FormattedMessage defaultMessage="Stream Earnings" />
            </h3>
          </div>
          {event && <ShareMenu ev={event} />}
        </div>
        <div>
          <FormattedMessage
            defaultMessage="{n} sats"
            values={{
              n: (
                <span className="text-3xl">
                  <FormattedNumber value={zapSum} />
                </span>
              ),
            }}
          />
          {rate.ask && (
            <div className="text-layer-5 text-sm">
              <FormattedNumber value={usdValue} style="currency" currency="USD" />
            </div>
          )}
        </div>
      </DashboardCard>
      <DashboardCard className="flex flex-col gap-4 grow">
        <h3>
          <FormattedMessage defaultMessage="Zaps" />
        </h3>
        <div className="flex flex-col gap-2 overflow-y-scroll">
          {latestZap && <DashboardHighlightZap zap={latestZap} />}
          {sortedZaps.slice(1).map(a => (
            <ChatZap zap={a} />
          ))}
        </div>
      </DashboardCard>
    </div>
  );
}
