import { ChatApis, type ExternalChatFeed, type ExternalChatEvent, type ExternalChatBadge } from "@/service/chat/types";
import { useEffect, useRef, useState } from "react";

export function useLegacyChatFeed(props: { enable?: boolean } | undefined) {
    const twitchRef = useRef<ExternalChatFeed | undefined>(undefined);
    const youtubeRef = useRef<ExternalChatFeed | undefined>(undefined);
    const kickRef = useRef<ExternalChatFeed | undefined>(undefined);
    const [events, setEvents] = useState<Array<ExternalChatEvent>>([]);
    const [badges, setBadges] = useState<Array<ExternalChatBadge>>([]);

    useEffect(() => {
        if (!props?.enable) return;
        if (ChatApis.twitch.isAuthed() && twitchRef.current === undefined) {
            const feed = ChatApis.twitch.getFeed();
            feed.on("chat", e => setEvents(v => [...v, e]));
            feed.connectFeed().catch(console.error).then(async () => {
                const b = await feed.getBadges();
                setBadges(x => [...x, ...b]);
            });
            twitchRef.current = feed;
        }
        if (ChatApis.youtube.isAuthed() && youtubeRef.current === undefined) {
            const feed = ChatApis.youtube.getFeed();
            feed.on("chat", e => setEvents(v => [...v, e]));
            feed.connectFeed().catch(console.error).then(async () => {
                const b = await feed.getBadges();
                setBadges(x => [...x, ...b]);
            });
            youtubeRef.current = feed
        }
        if (ChatApis.kick.isAuthed() && kickRef.current === undefined) {
            const feed = ChatApis.kick.getFeed();
            feed.on("chat", e => setEvents(v => [...v, e]));
            feed.connectFeed().catch(console.error).then(async () => {
                const b = await feed.getBadges();
                setBadges(x => [...x, ...b]);
            });
            kickRef.current = feed;
        }
    }, [props]);

    return {
        events,
        badges,
        twitch: twitchRef.current,
        youtube: youtubeRef.current,
        kick: kickRef.current
    };
}