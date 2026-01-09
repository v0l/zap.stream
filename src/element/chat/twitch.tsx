import TwitchIcon from "../../twitch.png";
import { Icon } from "../icon";
import dayjs from "dayjs";
import type { BadgeSet, ChatNotificationEvent } from "@/service/chat/twitch-chat";
import { Text } from "@/element/text";
import type { ExternalChatEvent } from "@/service/chat/types";

export function TwitchChatMessage({ ev, created_at }: { ev: ExternalChatEvent, created_at: number }) {
    const chat = ev.internal as ChatNotificationEvent;
    const badges: Array<BadgeSet> = [];
    return <div className="leading-6 overflow-wrap">
        <span className="inline-flex gap-2 items-center mr-1 align-bottom">
            <img src={TwitchIcon} width={16} height={16} className="mx-[4px]" />
            <div className="flex gap-1 items-center">
                {chat.badges.map(b => {
                    if (b.set_id === "broadcaster" && b.id === "1") {
                        return <Icon name="signal" size={16} className="text-primary" />
                    }
                    const badge = badges.find(x => x.set_id === b.set_id)?.versions.find(x => x.id === b.id);
                    if (badge) {
                        return <img src={badge.image_url_1x} height={16} width={16} title={badge.title} />
                    }
                })}
            </div>
            <span style={{
                color: chat.color
            }} className="font-medium text-secondary">
                {chat.chatter_user_name}
            </span>
        </span>
        <span title={dayjs(created_at * 1000).format("MMM D, h:mm A")}>
            <Text content={chat.message.text ?? ""} tags={[]} />
        </span>
    </div>
}