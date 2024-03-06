import { ChatZap } from "@/element/live-chat";
import { NostrLink, TaggedNostrEvent } from "@snort/system";
import { useEventReactions } from "@snort/system-react";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { DashboardCard } from "./card";
import { DashboardHighlightZap } from "./zap-highlight";

export function DashboardZapColumn({ link, feed }: { link: NostrLink; feed: Array<TaggedNostrEvent>; }) {
  const reactions = useEventReactions(link, feed);

  const sortedZaps = useMemo(
    () => reactions.zaps.sort((a, b) => (b.created_at > a.created_at ? 1 : -1)),
    [reactions.zaps]
  );
  const latestZap = sortedZaps.at(0);
  return (
    <DashboardCard className="min-h-0 h-full flex flex-col gap-4">
      <h3>
        <FormattedMessage defaultMessage="Zaps" id="OEW7yJ" />
      </h3>
      <div className="flex flex-col gap-2 overflow-y-scroll">
        {latestZap && <DashboardHighlightZap zap={latestZap} />}
        {sortedZaps.slice(1).map(a => (
          <ChatZap zap={a} />
        ))}
      </div>
    </DashboardCard>
  );
}
