import { hexToBech32 } from "@snort/shared";
import { NostrLink, ParsedZap } from "@snort/system";
import { useUserProfile } from "@snort/system-react";
import { useCurrentStreamFeed } from "hooks/current-stream-feed";
import { useZaps } from "hooks/zaps";
import { formatSats } from "number";
import { FormattedMessage } from "react-intl";
import { eventToLink } from "utils";

export function ZapAlerts({ link }: { link: NostrLink }) {
    const currentEvent = useCurrentStreamFeed(link, true);
    const currentLink = currentEvent ? eventToLink(currentEvent) : undefined;
    const zaps = useZaps(currentLink, true);

    return <div className="flex f-center f-col zap-alert-widgets">
        {zaps.slice(0, 5).map(v => <ZapAlertItem key={v.id} item={v} />)}
    </div>
}

export function ZapAlertItem({ item }: { item: ParsedZap }) {
    const profile = useUserProfile(item.sender);
    if (!profile) return;
    return <div className="zap-alert">
        <div>
            <FormattedMessage defaultMessage="Incoming Zap" />
        </div>
        <div>
            <FormattedMessage defaultMessage="{name} with {amount}" values={{
                name: <span className="highlight">{profile?.name ?? hexToBech32("npub", item?.sender ?? "").slice(0, 12)}&nbsp;</span>,
                amount: <span className="highlight">&nbsp;{formatSats(item.amount)}</span>
            }} />
        </div>
    </div>
}