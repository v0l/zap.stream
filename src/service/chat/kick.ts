// Fetch Chatroom => https://kick.com/api/v2/channels/{channel}/chatroom
// Chat access may be possible via the websocket directly (wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false)
// SEND: {"event":"pusher:subscribe","data":{"auth":"","channel":"chatrooms.332923.v2"}}
// RECV: {"event":"App\\Events\\ChatMessageEvent","data":"{\"id\":\"c0c85e41-2d34-45f4-9b57-bc7799245858\",\"chatroom_id\":332923,\"content\":\"corsette is crazy\",\"type\":\"message\",\"created_at\":\"2026-01-08T10:12:23+00:00\",\"sender\":{\"id\":2789967,\"username\":\"virtualmeal\",\"slug\":\"virtualmeal\",\"identity\":{\"color\":\"#BC66FF\",\"badges\":[{\"type\":\"moderator\",\"text\":\"Moderator\"},{\"type\":\"subscriber\",\"text\":\"Subscriber\",\"count\":4}]}},\"metadata\":{\"message_ref\":\"1767867143097\"}}","channel":"chatrooms.332923.v2"}

import EventEmitter from "eventemitter3";
import type { ExternalChatEvents, ExternalChatFeed, ChatInfo, ExternalChatBadge } from "./types";

export class KickChat extends EventEmitter<ExternalChatEvents> implements ExternalChatFeed {

    constructor(readonly channel_name: string) {
        super();
    }

    async getBadges(): Promise<Array<ExternalChatBadge>> {
        return [];
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

    }

}