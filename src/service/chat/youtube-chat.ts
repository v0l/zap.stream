import EventEmitter from "eventemitter3";
import { LiveChatMessageListRequest, LiveChatMessageSnippet_TypeWrapper_Type, GrpcWebImpl, V3DataLiveChatMessageServiceClientImpl } from "./stream_list";
import type { ChatInfo, ExternalChatFeed, ExternalChatEvents, OAuthToken, ExternalChatBadge } from "./types";
import { BrowserHeaders } from "browser-headers";
import { grpc } from "@improbable-eng/grpc-web";
import { unixNow } from "@snort/shared";

export class YoutubeChat extends EventEmitter<ExternalChatEvents> implements ExternalChatFeed {
    private clientId: string;
    private token: OAuthToken;
    private connectedTime: number = 0;
    private myChannel: ChannelResource | undefined;

    constructor(clientId: string, token: OAuthToken) {
        super();
        this.clientId = clientId;
        this.token = token;
    }
    
    currentViewers(): Promise<number | undefined> {
        throw new Error("Method not implemented.");
    }

    async getBadges(): Promise<Array<ExternalChatBadge>> {
        // TODO: add member badges
        return [];
    }

    connectFeed(): Promise<void> {
        return this.subscribeMyChat();
    }

    getInfo(): ChatInfo {
        return {
            connected: this.connectedTime,
            name: this.myChannel?.snippet?.title ?? "",
            provider_name: "YouTube"
        }
    }

    disconnect(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    /**
     * Get the live chat of the authorized user
     */
    async subscribeMyChat() {
        const liveStreams = await this.loadLiveStreams();
        const firstLive = liveStreams.items[0];
        if (firstLive?.id.videoId) {
            const video = await this.loadVideoInfo(firstLive.id.videoId);
            const firstVideo = video.items[0];
            if (!firstLive) {
                throw new Error("Error loading live video info");
            }
            const chatId = firstVideo.liveStreamingDetails?.activeLiveChatId;
            if (!chatId) {
                throw new Error("No live stream chat id associated with video");
            }
            await this.subscribeChat(chatId);
        }
    }

    private async loadMyChannel() {
        if (this.myChannel) {
            return this.myChannel;
        }
        const params = [
            ["part", "snippet"],
            ["mine", "true"]
        ];

        const json = await this.getApiResponse<ChannelResource>("channels", params);
        this.myChannel = json.items[0];
        return this.myChannel;
    }

    private async loadLiveStreams() {
        const channel = await this.loadMyChannel();
        const params = [
            ["part", "snippet"],
            ["channelId", channel.id],
            ["type", "video"],
            ["eventType", "live"],
        ];

        return await this.getApiResponse<SearchResource>("search", params);
    }

    private async loadVideoInfo(id: string | Array<string>) {
        const params = [
            ["part", "snippet,liveStreamingDetails"],
            ["id", Array.isArray(id) ? id.join(",") : id],
        ];

        return await this.getApiResponse<VideoResource>("videos", params);
    }

    private async getApiResponse<T>(path: string, params: Array<Array<string> | [string, string]>) {
        const u = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
        u.searchParams.set("access_token", "oauth2-token");
        for (const [k, v] of params) {
            u.searchParams.set(k, v);
        }

        const req = await fetch(u, {
            headers: {
                accept: "application/json",
                authorization: `Bearer ${this.token.access_token}`
            }
        });
        const json = await req.json() as PageResult<T>;
        console.debug(json);
        return json;
    }

    subscribeChat(chatId: string) {
        // must use gRPC-WEB proxy
        const rpc = new GrpcWebImpl("https://ytproxy.zap.stream", {
            streamingTransport: grpc.WebsocketTransport()
        })
        const client = new V3DataLiveChatMessageServiceClientImpl(rpc);
        const headers = new BrowserHeaders();
        headers.append("Authorization", `Bearer ${this.token.access_token}`);
        const stream = client.StreamList(LiveChatMessageListRequest.fromPartial({
            part: ["snippet", "authorDetails"],
            liveChatId: chatId
        }), headers);
        this.connectedTime = unixNow();
        return stream.forEach(data => {
            for (const chat of data.items) {
                console.debug(chat);
                if (chat.snippet?.type === LiveChatMessageSnippet_TypeWrapper_Type.TEXT_MESSAGE_EVENT) {
                    this.emit("chat", {
                        feed: "youtube",
                        created_at: Math.floor(new Date(chat.snippet?.publishedAt ?? new Date()).getTime() / 1000),
                        id: chat.id ?? "",
                        internal: chat
                    });
                }

            }
        });
    }
}

interface PageResult<T> {
    kind: string;
    nextPageToken?: string;
    prevPageToken?: string;
    pageInfo?: {
        totalResults: number;
        resultsPerPage: number;
    },
    items: Array<T>
}

interface ChannelResource {
    id: string,
    snippet?: {
        title: string,
        description: string,
    }
}

interface SearchResource {
    id: {
        kind: string;
        videoId?: string;
        channelId?: string;
        playlistId?: string;
    }
    snippet?: {
        publishedAt: string;
        title: string;
        liveBroadcastContent?: "live" | "none" | "upcoming"
    }
}

interface VideoResource {
    id: string;
    snippet?: {
        liveBroadcastContent?: "live" | "none" | "upcoming"
    },
    liveStreamingDetails?: LiveStreamingDetails
}

interface LiveStreamingDetails {
    actualStartTime?: string;
    actualEndTime?: string;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    concurrentViewers?: number;
    activeLiveChatId?: string;
}