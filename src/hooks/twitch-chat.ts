import { TwitchApiClientId } from "@/const";
import { type BadgeSet, type ChatNotificationEvent, type SubscriptionMetadata, TwitchChat } from "@/service/twitch-chat";
import { useEffect, useRef, useState } from "react";

export interface TwitchChatLog {
    meta: SubscriptionMetadata,
    event: ChatNotificationEvent
}

export function useTwitchChat(token?: string) {
    const twitch = useRef<TwitchChat | undefined>(undefined);
    const [chatLog, setChatLog] = useState<Array<TwitchChatLog>>([]);
    const [badges, setBadges] = useState<Array<BadgeSet>>([]);
    const appendChat = (meta: SubscriptionMetadata, e: ChatNotificationEvent) => {
        setChatLog(l => [...l, { meta, event: e }]);
    }
    useEffect(() => {
        if (!twitch.current) {
            const api = new TwitchChat(TwitchApiClientId, token);
            twitch.current = api;
            api.on("chat", appendChat);
            api.connect().then(async () => {
                await api.subscribeMyChat();
                const badges = (await Promise.all([
                    api.getChannelBadges(api.token!.user_id),
                    api.getGlobalBadges()
                ])).flat();
                setBadges(badges);
            }).catch((e) => {
                console.error(e);
                twitch.current = undefined;
            });
        }
    }, [token]);
    return {
        chatLog,
        badges,
        connected_at: twitch.current?.connected_at,
        login: twitch.current?.login
    };
}