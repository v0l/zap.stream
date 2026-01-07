import type { TaggedNostrEvent } from "@snort/system";
import TwitchIcon from "../../twitch.png";
import type { TwitchChatLog } from "@/hooks/twitch-chat";
import { Icon } from "../icon";
import dayjs from "dayjs";
import type { BadgeSet } from "@/service/twitch-chat";
import { Text } from "@/element/text";

export function TwitchChatMessage({ ev, badges }: { ev: TaggedNostrEvent, badges: Array<BadgeSet> }) {
    const notification = "chat" in ev ? ev["chat"] as TwitchChatLog : undefined;
    return <div className="leading-6 overflow-wrap">
        <div className="inline-flex gap-1 items-center mr-1">
            <img src={TwitchIcon} width={16} height={16} className="mx-[4px]" />
            {notification?.event.badges.map(b => {
                if (b.set_id === "broadcaster" && b.id === "1") {
                    return <Icon name="signal" size={16} className="text-primary" />
                }
                const badge = badges.find(x => x.set_id === b.set_id)?.versions.find(x => x.id === b.id);
                if (badge) {
                    return <img src={badge.image_url_1x} height={16} width={16} title={badge.title} />
                }
            })}
            <span style={{
                color: notification?.event.color
            }} className="align-bottom font-medium text-secondary">
                {notification?.event.chatter_user_name}
            </span>
        </div>
        <span title={dayjs(ev.created_at * 1000).format("MMM D, h:mm A")}>
            <Text content={notification?.event.message.text ?? ""} tags={[]} />
        </span>
    </div>
}