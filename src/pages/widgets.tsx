/* eslint-disable @typescript-eslint/no-unused-vars */
import "./widgets.css";
import { NostrPrefix, createNostrLink } from "@snort/system";
import Copy from "element/copy";
import { useCurrentStreamFeed } from "hooks/current-stream-feed";
import { useLogin } from "hooks/login";
import { FormattedMessage } from "react-intl";
import { eventToLink, hexToBech32 } from "utils";
import { ZapAlertItem } from "./widgets/zaps";
import { TopZappersWidget } from "./widgets/top-zappers";
import { Views } from "./widgets/views";

export function WidgetsPage() {
    const login = useLogin();
    const profileLink = createNostrLink(NostrPrefix.PublicKey, login?.pubkey ?? "");
    const current = useCurrentStreamFeed(profileLink);
    const currentLink = current ? eventToLink(current) : undefined;
    const npub = hexToBech32("npub", login?.pubkey);

    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    return <div className="widgets g8">
        <div className="flex f-col g8">
            <h3>
                <FormattedMessage defaultMessage="Chat Widget" />
            </h3>
            <Copy text={`${baseUrl}/chat/${npub}`} />
        </div>
        <div className="flex f-col g8">
            <h3>
                <FormattedMessage defaultMessage="Zap Alert" />
            </h3>
            <Copy text={`${baseUrl}/alert/${npub}/zaps`} />
            <ZapAlertItem item={{
                id: "",
                valid: true,
                zapService: "",
                anonZap: false,
                errors: [],
                sender: login?.pubkey,
                amount: 1_000_000
            }} />
        </div>
        <div className="flex f-col g8">
            <h3>
                <FormattedMessage defaultMessage="Top Zappers" />
            </h3>
            <Copy text={`${baseUrl}/alert/${npub}/top-zappers`} />
            {currentLink && <TopZappersWidget link={currentLink} />}
        </div>
        <div className="flex f-col g8">
            <h3>
                <FormattedMessage defaultMessage="Current Viewers" />
            </h3>
            <Copy text={`${baseUrl}/alert/${npub}/views`} />
            {currentLink && <Views link={currentLink} />}
        </div>
    </div>
}