import { EventKind, parseNostrLink } from "@snort/system";

export const LIVE_STREAM = 30_311 as EventKind;
export const LIVE_STREAM_CHAT = 1_311 as EventKind;
export const LIVE_STREAM_RAID = 1_312 as EventKind;
export const LIVE_STREAM_CLIP = 1_313 as EventKind;
export const GOAL = 9041 as EventKind;
export const USER_CARDS = 17_777 as EventKind;
export const CARD = 37_777 as EventKind;

export const VIDEO_KIND = 21 as EventKind;
export const SHORTS_KIND = 22 as EventKind;
export const OLD_VIDEO_KIND = 34_235 as EventKind;
export const OLD_SHORTS_KIND = 34_236 as EventKind;

export const MINUTE = 60;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY;

export enum StreamState {
  Live = "live",
  Ended = "ended",
  Planned = "planned",
  VOD = "vod",
}

export const defaultRelays = {
  //"ws://localhost:8081": { read: true, write: true },
  "wss://relay.snort.social": { read: true, write: true },
  "wss://nos.lol": { read: true, write: true },
  "wss://relay.damus.io": { read: true, write: true },
  "wss://nostr.wine": { read: true, write: true },
};

export const DefaultProviderUrl = "https://api.zap.stream/api/nostr";
//export const DefaultProviderUrl = "http://localhost:5295/api/nostr";

function loadWhitelist() {
  if (import.meta.env.VITE_SINGLE_PUBLISHER !== undefined) {
    const list = import.meta.env.VITE_SINGLE_PUBLISHER as string | undefined;
    if (list) {
      return list.split(",").map(a => {
        if (a.startsWith("npub")) {
          return parseNostrLink(a).id;
        } else {
          return a;
        }
      });
    }
  }
  return undefined;
}

export const WHITELIST: Array<string> | undefined = loadWhitelist();

export const NIP5_DOMAIN: string = import.meta.env.VITE_NIP5_DOMAIN || "zap.stream";