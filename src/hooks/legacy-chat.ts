import { ChatApis, type ExternalChatFeed, type ExternalChatEvent } from "@/service/chat/types";
import { useEffect, useRef, useState } from "react";

export function useLegacyChatFeed(props: { enable?: boolean } | undefined) {
    const twitchRef = useRef<ExternalChatFeed | undefined>(undefined);
    const youtubeRef = useRef<ExternalChatFeed | undefined>(undefined);
    const kickRef = useRef<ExternalChatFeed | undefined>(undefined);
    const [events, setEvents] = useState<Array<ExternalChatEvent>>([]);

    useEffect(() => {
        if (!props?.enable) return;
        if (ChatApis.twitch.isAuthed() && twitchRef.current === undefined) {
            const feed = ChatApis.twitch.getFeed();
            feed.on("chat", e => setEvents(v => [...v, e]));
            feed.connectFeed().catch(console.error);
            twitchRef.current = feed;
        }
        if (ChatApis.youtube.isAuthed() && youtubeRef.current === undefined) {
            const feed = ChatApis.youtube.getFeed();
            feed.on("chat", e => setEvents(v => [...v, e]));
            feed.connectFeed().catch(console.error);
            youtubeRef.current = feed
        }
        if (ChatApis.kick.isAuthed() && kickRef.current === undefined) {
            const feed = ChatApis.kick.getFeed();
            feed.on("chat", e => setEvents(v => [...v, e]));
            feed.connectFeed().catch(console.error);
            kickRef.current = feed;
        }
    }, [props]);

    return {
        events,
        twitch: twitchRef.current,
        youtube: youtubeRef.current,
        kick: kickRef.current
    };
}