import { NostrLink } from "@snort/system";
import { useCurrentStreamFeed } from "hooks/current-stream-feed";
import { FormattedMessage } from "react-intl";
import { findTag } from "utils";

export function Views({ link }: { link: NostrLink }) {
  const current = useCurrentStreamFeed(link, true);

  const viewers = findTag(current, "current_participants");
  const n = Number(viewers);
  return (
    <div className="views">
      {isNaN(n) ? (
        <FormattedMessage defaultMessage="No viewer data available" />
      ) : (
        <FormattedMessage defaultMessage="{n} viewers" values={{ n }} />
      )}
    </div>
  );
}
