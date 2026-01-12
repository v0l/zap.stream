import EventEmitter from "eventemitter3";
import type { ExternalChatEvents, ExternalChatFeed, ChatInfo, ExternalChatBadge } from "./types";

export class KickChat extends EventEmitter<ExternalChatEvents> implements ExternalChatFeed {

    constructor(readonly channel_name: string) {
        super();
    }

    async currentViewers(): Promise<number | undefined> {
        const videos = await this.getVideos(this.channel_name);
        const liveVideo = videos.find(a => a.is_live);
        if (liveVideo) {
            const req = await fetch(`https://kick.com/current-viewers?ids[]=${liveVideo.id}`);
            const views = await req.json() as Array<{ livestream_id: number, viewers: number }>;
            return views.at(0)?.viewers;
        }
    }

    async getBadges(): Promise<Array<ExternalChatBadge>> {
        // https://files.kick.com/channel_subscriber_badges/537584/original
        // badge ids are embedded in the page HTML
        return [];
    }

    private async getVideos(channel: string) {
        const req = await fetch(`https://kick.com/api/v2/channels/${channel}/videos`);
        return await req.json() as Array<VideoResult>;
    }

    connectFeed(): Promise<void> {
        return this.subscribeChat(this.channel_name);
    }

    getInfo(): ChatInfo {
        return {
            connected: 0,
            name: this.channel_name,
            provider_name: "Kick"
        }
    }

    disconnect(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async subscribeChat(channel: string) {
        const info = await this.getChatRoomId(channel);

        // TODO: load history https://web.kick.com/api/v1/chat/56013809/history
        const ws = await new Promise<WebSocket>((resolve, reject) => {
            const ws = new WebSocket("wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false");
            ws.onopen = (e) => {
                const req = {
                    event: "pusher:subscribe",
                    data: {
                        auth: "",
                        channel: `chatrooms.${info.id}.v2`
                    }
                } satisfies PusherEvent<ChannelRequest>;
                ws.send(JSON.stringify(req));
                resolve(ws);
            };
            ws.onerror = reject;
        });
        ws.onmessage = (e) => {
            this.onMessage(e);
        }
    }

    private onMessage(msg: MessageEvent) {
        if (typeof msg.data !== "string") {
            return;
        }
        const json = msg.data as string;
        const event = JSON.parse(json) as PusherEvent<string>;
        switch (event.event) {
            case "App\\Events\\ChatMessageEvent": {
                const chat = JSON.parse(event.data) as ChatMessageEvent;
                this.emit("chat", {
                    feed: "kick",
                    created_at: new Date(chat.created_at).getTime() / 1000,
                    id: chat.id,
                    internal: chat
                });
                break;
            }
            default: {
                console.warn(`Unknown event ${event.event}`, event);
            }
        }
    }


    private async getChatRoomId(channel: string) {
        const req = await fetch(`https://kick.com/api/v2/channels/${channel}/chatroom`);
        const json = await req.json() as ChatRoomInfo;
        return json;
    }

}

export interface ChatRoomInfo {
    id: number
    slow_mode: SlowMode
    subscribers_mode: SubscribersMode
    followers_mode: FollowersMode
    emotes_mode: EmotesMode
    advanced_bot_protection: AdvancedBotProtection
    account_age: AccountAge
    pinned_message: any
    show_quick_emotes: ShowQuickEmotes
    show_banners: ShowBanners
    gifts_enabled: GiftsEnabled
    gifts_week_enabled: GiftsWeekEnabled
    gifts_month_enabled: GiftsMonthEnabled
}

export interface SlowMode {
    enabled: boolean
    message_interval: number
}

export interface SubscribersMode {
    enabled: boolean
}

export interface FollowersMode {
    enabled: boolean
    min_duration: number
}

export interface EmotesMode {
    enabled: boolean
}

export interface AdvancedBotProtection {
    enabled: boolean
    remaining_time: number
}

export interface AccountAge {
    enabled: boolean
    min_duration: number
}

export interface ShowQuickEmotes {
    enabled: boolean
}

export interface ShowBanners {
    enabled: boolean
}

export interface GiftsEnabled {
    enabled: boolean
}

export interface GiftsWeekEnabled {
    enabled: boolean
}

export interface GiftsMonthEnabled {
    enabled: boolean
}

interface PusherEvent<T> {
    event: string;
    data: T
}

interface ChannelRequest {
    auth: string;
    channel: string;
}

export interface ChatMessageEvent {
    id: string
    chatroom_id: number
    content: string
    type: string
    created_at: string
    sender: Sender
}

export interface Sender {
    id: number
    username: string
    slug: string
    identity: Identity
}

export interface Identity {
    color: string
    badges: any[]
}

export interface VideoResult {
    id: number
    slug: string
    channel_id: number
    created_at: string
    session_title: string
    is_live: boolean
    risk_level_id: any
    start_time: string
    source: string
    twitch_channel: any
    duration: number
    language: string
    is_mature: boolean
    viewer_count: number
    tags: any[]
    thumbnail: Thumbnail
    views: number
    video: Video
    categories: Category[]
    channel: Channel
}

export interface Thumbnail {
    src: string
    srcset: string
}

export interface Video {
    id: number
    live_stream_id: number
    slug: any
    thumb: any
    s3: any
    trading_platform_id: any
    created_at: string
    updated_at: string
    uuid: string
    views: number
    deleted_at: any
    is_pruned: boolean
    is_private: boolean
    status: string
}

export interface Category {
    id: number
    category_id: number
    name: string
    slug: string
    tags: string[]
    description: any
    deleted_at: any
    is_mature: boolean
    is_promoted: boolean
    viewers: number
    is_fallback: boolean
    banner: Banner
}

export interface Banner {
    responsive: string
    url: string
}

export interface Channel {
    id: number
    user_id: number
    slug: string
    is_banned: boolean
    playback_url: string
    name_updated_at: any
    vod_enabled: boolean
    subscription_enabled: boolean
    is_affiliate: boolean
    can_host: boolean
}
