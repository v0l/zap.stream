import type { LiveChatMessage } from "@/service/chat/stream_list";
import type { ExternalChatBadge, ExternalChatEvent } from "@/service/chat/types";
import { Text } from "@/element/text";
import dayjs from "dayjs";
import YoutubeIcon from "@/youtube.png";
import { Icon } from "../icon";

export function YoutubeChatMessage({ ev }: { ev: ExternalChatEvent, badges: Array<ExternalChatBadge> }) {
    const chat = ev.internal as LiveChatMessage;

    return <div className="leading-6 overflow-wrap">
        <span className="inline-flex gap-2 items-center mr-1 align-bottom">
            <img src={YoutubeIcon} width={16} height={16} className="mx-[4px]" />
            {chat.authorDetails?.isChatOwner && <Icon name="signal" size={16} className="text-primary" />}
            {/* {chat.badges.map(b => {
                if (b.set_id === "broadcaster" && b.id === "1") {
                    return <Icon name="signal" size={16} className="text-primary" />
                }
                const badge = badges.find(x => x.set_id === b.set_id)?.versions.find(x => x.id === b.id);
                if (badge) {
                    return <img src={badge.image_url_1x} height={16} width={16} title={badge.title} />
                }
            })} */}
            <span className="font-medium text-secondary">
                {chat.authorDetails?.displayName}
            </span>
        </span>
        <span title={dayjs(chat.snippet?.publishedAt).format("MMM D, h:mm A")}>
            <Text content={chat.snippet?.displayMessage ?? ""} tags={[]} />
        </span>
    </div>
}