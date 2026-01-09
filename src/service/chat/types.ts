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
} & EventEmitter<ExternalChatEvents>;

export interface ExternalChatEvents {
    chat(ev: ExternalChatEvent): void;
}

export interface ExternalChatEvent {
    feed: "twitch" | "youtube" | "kick",
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
        const api = new YoutubeChat(YoutubeApiClientId, token?.access_token);
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
    const params = [
        "response_type=token",
        `client_id=${encodeURIComponent(clientId)}`,
        `redirect_uri=${encodeURIComponent(redirect_uri)}`,
        `scope=${encodeURIComponent(scopes.join(" "))}`
    ];
    const state = uuid();
    window.localStorage.setItem(`auth:state:${base}`, state);
    params.push(`state=${encodeURIComponent(state)}`);
    return `${base}?${params.join("&")}`;
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