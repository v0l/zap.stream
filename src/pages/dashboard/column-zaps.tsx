import { ChatZap } from "@/element/chat/live-chat";
import { NostrLink, TaggedNostrEvent } from "@snort/system";
import { useEventReactions } from "@snort/system-react";
import { useMemo } from "react";
import { FormattedMessage, FormattedNumber } from "react-intl";
import { DashboardCard } from "./card";
import { DashboardHighlightZap } from "./zap-highlight";
import ZapGlow from "./zap-glow";
import { ShareMenu } from "@/element/share-menu";

export function DashboardZapColumn({
  ev,
  link,
  feed,
}: {
  ev: TaggedNostrEvent;
  link: NostrLink;
  feed: Array<TaggedNostrEvent>;
}) {
  const reactions = useEventReactions(link, feed);
  const sortedZaps = useMemo(
    () => reactions.zaps.sort((a, b) => (b.created_at > a.created_at ? 1 : -1)),
    [reactions.zaps],
  );
  const latestZap = sortedZaps.at(0);
  const zapSum = sortedZaps.reduce((acc, v) => acc + v.amount, 0);

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
          <ShareMenu ev={ev} />
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
