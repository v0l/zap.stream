import type EventEmitter from "eventemitter3";
import { v4 as uuid } from "uuid";
import { TwitchChat } from "./twitch-chat";
import { TwitchApiClientId, YoutubeApiClientId } from "@/const";
import { YoutubeChat } from "./youtube-chat";
import { KickChat } from "./kick";
import { base64 } from "@scure/base";

export interface ChatProvider {
    name: string;
    authType: "none" | "oauth",

    /**
     * Get the implicit OAuth url to redirect to
     * @param redirect_uri URL to return to (should match on provider side)
     */
    getAuthUrl(redirect_uri: string): string;

    /**
     * Save auth token response
     */
    handleAuthCallback(token: string): void;

    /**
     * Get a chat feed instance
     */
    getFeed(): ExternalChatFeed;

    /**
     * Get the expiry time of the access
     */
    expireTime(): number | undefined;

    /**
     * Is the account already authed
     */
    isAuthed(): boolean;

    /**
     * Delete saved auth token
     */
    disconnect(): void;

    /**
     * Get params to pass to widget urls
     */
    getWidgetParams(): string | undefined;

    /**
     * Load the auth tokens from the widget params
     */
    loadFromWidgetParams(token: string): void;
}

export interface OAuthToken {
    token_type: string;
    access_token: string;
    scope: string;
    expires_in?: number;
    created: number;
}

export interface ChatInfo {
    /**
     * Timestamp when the chat was connected
     */
    connected: number;

    /**
     * External chat feed name (Channel name)
     */
    name: string;

    /**
     * Name of the chat provider (Twitch / YouTube etc..)
     */
    provider_name: string;
}

export type ExternalChatFeed = {
    /**
     * Connect to the chat feed
     */
    connectFeed(): Promise<void>;

    /**
     * Get the generic chat info from the external feed
     */
    getInfo(): ChatInfo;

    /**
     * Disconnect from the chat feed and cleanup resources
     */
    disconnect(): Promise<void>;

    /**
     * Load badge information
     */
    getBadges(): Promise<Array<ExternalChatBadge>>;

    /**
     * Get the current number of viewers 
     */
    currentViewers(): Promise<number | undefined>;

} & EventEmitter<ExternalChatEvents>;

export type FeedType = "twitch" | "youtube" | "kick";

export interface ExternalChatEvents {
    chat(ev: ExternalChatEvent): void;
}

export interface ExternalChatBadge {
    feed: FeedType;
    id: string;
    title?: string;
    url: string;
}

export interface ExternalChatEvent {
    feed: FeedType,
    created_at: number;
    id: string;
    internal: unknown;
}

const TwitchAuthUrl = "https://id.twitch.tv/oauth2/authorize";
const YoutubeAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";

abstract class OAuthChatProvider implements ChatProvider {
    authType: "none" | "oauth";

    constructor(readonly name: string, readonly url: string, readonly clientId: string, readonly scopes: Array<string>) {
        this.authType = "oauth";
    }

    abstract getFeed(): ExternalChatFeed;

    expireTime() {
        const token = getAuthToken<OAuthToken>(this.url);
        const expire = Number(token?.expires_in);
        const created = Number(token?.created);
        if (Number.isSafeInteger(expire) && Number.isSafeInteger(created)) {
            return created + expire;
        }
    }

    getAuthUrl(redirect_uri: string) {
        return getAuthUrl(this.url, this.clientId, redirect_uri, this.scopes);
    }

    handleAuthCallback(token: string) {
        saveAuthToken(this.url, token);
    }

    isAuthed() {
        return getAuthToken<OAuthToken>(this.url) !== undefined;
    }

    disconnect() {
        deleteAuthToken(this.url);
    }

    getWidgetParams() {
        const token = getAuthToken<OAuthToken>(this.url);
        if (token) {
            return base64.encode(new TextEncoder().encode(JSON.stringify(token)));
        }
    }

    loadFromWidgetParams(token: string) {
        const obj = JSON.parse(new TextDecoder().decode(base64.decode(token))) as OAuthToken;
        if (obj?.access_token) {
            saveRawAuthToken(this.url, obj);
        }
    }
}

abstract class NoAuthChatProvider implements ChatProvider {
    authType: "none" | "oauth";

    constructor(readonly name: string, readonly id: string) {
        this.authType = "none";
    }

    expireTime(): number | undefined {
        return undefined;
    }

    abstract getFeed(): ExternalChatFeed;

    getAuthUrl(): string {
        throw new Error("Not implemented");
    }

    handleAuthCallback(token: string) {
        saveAuthToken(this.id, token);
    }

    isAuthed() {
        return getAuthToken<any>(this.id) !== undefined;
    }

    disconnect() {
        deleteAuthToken(this.id);
    }

    getWidgetParams() {
        const token = getAuthToken<{ channel: string }>(this.id);
        if (token) {
            return base64.encode(new TextEncoder().encode(JSON.stringify(token)));
        }
    }

    loadFromWidgetParams(token: string) {
        const obj = JSON.parse(new TextDecoder().decode(base64.decode(token))) as { channel: string };
        if (obj?.channel) {
            saveRawAuthToken(this.id, obj);
        }
    }
}

class TwitchChatProvider extends OAuthChatProvider {
    getFeed() {
        const token = getAuthToken<OAuthToken>(TwitchAuthUrl);
        const api = new TwitchChat(TwitchApiClientId, token?.access_token);
        return api;
    }
}

class YoutubeChatProvider extends OAuthChatProvider {
    getFeed() {
        const token = getAuthToken<OAuthToken>(YoutubeAuthUrl);
        if (!token) {
            throw new Error("Cant connect to feed without auth token");
        }
        const api = new YoutubeChat(YoutubeApiClientId, token);
        return api;
    }
}

class KickChatProvider extends NoAuthChatProvider {
    getFeed() {
        const token = getAuthToken<{ channel: string }>(this.id);
        if (!token?.channel) {
            throw new Error("Channel not configured");
        }
        const api = new KickChat(token.channel);
        return api;
    }
}

export const ChatApis = {
    twitch: new TwitchChatProvider("Twitch", TwitchAuthUrl, TwitchApiClientId, ["user:read:chat"]) as ChatProvider,
    youtube: new YoutubeChatProvider("YouTube", YoutubeAuthUrl, YoutubeApiClientId, ["https://www.googleapis.com/auth/youtube.readonly"]) as ChatProvider,
    kick: new KickChatProvider("Kick", "kick") as ChatProvider,
};


function getAuthUrl(base: string, clientId: string, redirect_uri: string, scopes: Array<string>) {
    const u = new URL(base);

    const state = uuid();
    window.localStorage.setItem(`auth:state:${base}`, state);

    u.searchParams.set("response_type", "token");
    u.searchParams.set("client_id", clientId);
    u.searchParams.set("redirect_uri", redirect_uri);
    u.searchParams.set("scope", scopes.join(" "));
    u.searchParams.set("include_granted_scopes", "true");
    u.searchParams.set("prompt", "consent");
    u.searchParams.set("state", state);

    return u.toString();
}

function saveAuthToken(base: string, token: string) {
    // parse as query params and save as json obj
    const params = new URLSearchParams(token);
    const paramToken = params.get("state");

    const stateKey = `auth:state:${base}`;
    const savedToken = window.localStorage.getItem(stateKey);
    if (paramToken !== savedToken) {
        console.warn("Invalid CSRF state token");
        return;
    }
    params.delete("state");
    const authObj = Object.fromEntries(params.entries());
    saveRawAuthToken(base, authObj);
}

function saveRawAuthToken<T>(base: string, token: T) {
    window.localStorage.setItem(`auth:token:${base}`, JSON.stringify(token));
}

function getAuthToken<T>(base: string) {
    const json = window.localStorage.getItem(`auth:token:${base}`);
    if (json) {
        return JSON.parse(json) as T;
    }
}

function deleteAuthToken(base: string) {
    window.localStorage.removeItem(`auth:token:${base}`);
}