import type { NostrLink } from "@snort/system";
import { FormattedMessage } from "react-intl";

import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { findTag } from "@/utils";

export function Views({ link }: { link: NostrLink }) {
  const current = useCurrentStreamFeed(link, true);

  const viewers = findTag(current, "current_participants");
  const n = Number(viewers);
  return (
    <div className="views">
      {Number.isNaN(n) ? (
        <FormattedMessage defaultMessage="No viewer data available" id="AukrPM" />
      ) : (
        <FormattedMessage defaultMessage="{n} viewers" id="3adEeb" values={{ n }} />
      )}
    </div>
  );
}
