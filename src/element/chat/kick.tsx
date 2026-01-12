import type { ExternalChatBadge, ExternalChatEvent } from "@/service/chat/types";
import { Text } from "@/element/text";
import dayjs from "dayjs";
import KickIcon from "@/kick.png";
import type { ChatMessageEvent } from "@/service/chat/kick";

export function KickChatMessage({ ev, badges }: { ev: ExternalChatEvent, badges: Array<ExternalChatBadge> }) {
    const chat = ev.internal as ChatMessageEvent;

    return <div className="leading-6 overflow-wrap">
        <span className="inline-flex gap-2 items-center mr-1 align-bottom">
            <img src={KickIcon} width={16} height={16} className="mx-[4px]" />

            {chat.sender.identity.badges.map(b => {
                console.debug(b);
                const badge = badges.find(a => a.feed === "kick" && a.id === b.type);
                if (badge) {
                    return <img src={badge.url} height={16} width={16} title={badge.title} />
                }
            })}
            <span className="font-medium text-secondary" style={{
                color: chat.sender.identity.color
            }}>
                {chat.sender?.username}
            </span>
        </span>
        <span title={dayjs(chat.created_at).format("MMM D, h:mm A")}>
            <Text content={chat.content ?? ""} tags={[]} />
        </span>
    </div>
}