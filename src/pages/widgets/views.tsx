import { NostrLink } from "@snort/system";
import { useCurrentStreamFeed } from "hooks/current-stream-feed";
import { FormattedMessage } from "react-intl";
import { findTag } from "utils";

export function Views({ link }: { link: NostrLink }) {
    const current = useCurrentStreamFeed(link);

    const viewers = findTag(current, "current_participants");
    return <div className="views">
        <FormattedMessage defaultMessage="{n} viewers" values={{ n: Number(viewers) }} />
    </div>
}