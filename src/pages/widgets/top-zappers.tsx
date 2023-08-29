import { NostrLink } from "@snort/system";
import { TopZappers } from "element/top-zappers";
import { useCurrentStreamFeed } from "hooks/current-stream-feed";
import { useZaps } from "hooks/zaps";
import { FormattedMessage } from "react-intl";
import { eventToLink } from "utils";

export function TopZappersWidget({ link }: { link: NostrLink }) {
  const currentEvent = useCurrentStreamFeed(link, true);
  const zaps = useZaps(currentEvent ? eventToLink(currentEvent) : undefined, true);
  return (
    <div className="top-zappers-widget">
      <div>
        <FormattedMessage defaultMessage="Top Zappers" />
      </div>
      <div className="flex g8">
        <TopZappers zaps={zaps} limit={3} />
      </div>
    </div>
  );
}
