import { NostrLink } from "@snort/system";
import { FormattedMessage } from "react-intl";

import { TopZappers } from "@/element/top-zappers";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { useZaps } from "@/hooks/zaps";

export function TopZappersWidget({ link }: { link: NostrLink }) {
  const currentEvent = useCurrentStreamFeed(link, true);
  const zaps = useZaps(currentEvent ? NostrLink.fromEvent(currentEvent) : undefined, true);
  return (
    <div className="top-zappers-widget">
      <div>
        <FormattedMessage defaultMessage="Top Zappers" id="dVD/AR" />
      </div>
      <div className="flex gap-1">
        <TopZappers zaps={zaps} limit={3} />
      </div>
    </div>
  );
}
