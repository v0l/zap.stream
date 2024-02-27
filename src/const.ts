import { EventKind } from "@snort/system";

export const LIVE_STREAM = 30_311 as EventKind;
export const LIVE_STREAM_CHAT = 1_311 as EventKind;
export const LIVE_STREAM_RAID = 1_312 as EventKind;
export const LIVE_STREAM_CLIP = 1_313 as EventKind;
export const EMOJI_PACK = 30_030 as EventKind;
export const USER_EMOJIS = 10_030 as EventKind;
export const GOAL = 9041 as EventKind;
export const USER_CARDS = 17_777 as EventKind;
export const CARD = 37_777 as EventKind;
export const MUTED = 10_000 as EventKind;

export const DAY = 60 * 60 * 24;
export const WEEK = 7 * DAY;

export enum StreamState {
  Live = "live",
  Ended = "ended",
  Planned = "planned",
}

export const defaultRelays = {
  "ws://localhost:8081": { read: true, write: true },
  "wss://relay.snort.social": { read: true, write: true },
  "wss://nos.lol": { read: true, write: true },
  "wss://relay.damus.io": { read: true, write: true },
  "wss://nostr.wine": { read: true, write: true },
};

export const DefaultProviderUrl = "https://api.zap.stream/api/nostr/";
//export const DefaultProviderUrl = "http://localhost:5295/api/nostr/";
