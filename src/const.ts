import { type EventKind, parseNostrLink } from "@snort/system"
import {
  LIVE_STREAM as _LIVE_STREAM,
  N94_LIVE_STREAM as _N94_LIVE_STREAM,
  LIVE_STREAM_KINDS as _LIVE_STREAM_KINDS,
  LIVE_STREAM_CHAT as _LIVE_STREAM_CHAT,
  LIVE_STREAM_RAID as _LIVE_STREAM_RAID,
  LIVE_STREAM_CLIP as _LIVE_STREAM_CLIP,
  GOAL as _GOAL,
  VIDEO_KIND as _VIDEO_KIND,
  SHORTS_KIND as _SHORTS_KIND,
  OLD_VIDEO_KIND as _OLD_VIDEO_KIND,
  OLD_SHORTS_KIND as _OLD_SHORTS_KIND,
} from "@zap.stream/api"

// Re-export shared constants (cast to EventKind for @snort/system compatibility)
export const LIVE_STREAM = _LIVE_STREAM as EventKind
export const N94_LIVE_STREAM = _N94_LIVE_STREAM as EventKind
export const LIVE_STREAM_KINDS = _LIVE_STREAM_KINDS as Array<EventKind>
export const LIVE_STREAM_CHAT = _LIVE_STREAM_CHAT as EventKind
export const LIVE_STREAM_RAID = _LIVE_STREAM_RAID as EventKind
export const LIVE_STREAM_CLIP = _LIVE_STREAM_CLIP as EventKind
export const GOAL = _GOAL as EventKind
export const VIDEO_KIND = _VIDEO_KIND as EventKind
export const SHORTS_KIND = _SHORTS_KIND as EventKind
export const OLD_VIDEO_KIND = _OLD_VIDEO_KIND as EventKind
export const OLD_SHORTS_KIND = _OLD_SHORTS_KIND as EventKind
export { StreamState } from "@zap.stream/api"

// ─── App-specific constants (not part of the API library) ─────────────────────

export const ZAP_STREAM_PUBKEY = "cf45a6ba1363ad7ed213a078e710d24115ae721c9b47bd1ebf4458eaefb4c2a5"

export const USER_CARDS = 17_777 as EventKind
export const CARD = 37_777 as EventKind

export const MINUTE = 60
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR
export const WEEK = 7 * DAY
export const MONTH = 30 * DAY

export const defaultRelays = {
  //"ws://localhost:8081": { read: true, write: true },
  "wss://relay.snort.social": { read: true, write: true },
  "wss://nos.lol": { read: true, write: true },
  "wss://relay.damus.io": { read: true, write: true },
  "wss://nostr.wine": { read: true, write: true },
  "wss://relay.primal.net": { read: true, write: true },
  "wss://relay.fountain.fm": { read: true, write: true },
  "wss://relay.divine.video/": { read: true, write: true },
}

function loadWhitelist() {
  if (import.meta.env.VITE_SINGLE_PUBLISHER !== undefined) {
    const list = import.meta.env.VITE_SINGLE_PUBLISHER as string | undefined
    if (list) {
      return list.split(",").map(a => {
        if (a.startsWith("npub")) {
          return parseNostrLink(a).id
        } else {
          return a
        }
      })
    }
  }
  return undefined
}

export const WHITELIST: Array<string> | undefined = loadWhitelist()

export const NIP5_DOMAIN: string = import.meta.env.VITE_NIP5_DOMAIN || "zap.stream"

// Pubkeys allowed to use "host" tag
export const P_TAG_HOST_WHITELIST = [
  ZAP_STREAM_PUBKEY,
  "81ee947168db2f909895dbd4f71534f4040035575f58156e9a3802d1dd467e1d", //primalstream
  "f6a25b87f7e7bec9a691e37851b1b57a7b49fa00bb431280303002a3ebca4891", //streamstr (Grinder server)
  "85df822a86599ffbe8143db1e1e1bf2d162fa60fc685c65515963e67cfd7499f", //shosho streaming server
]

/// API client ID for twitch chat integration
export const TwitchApiClientId = "kirqzkkd71zdtlciwhcf2fgwvvcr8x"

/// API client ID for Youtube chat integration
export const YoutubeApiClientId = "858937139946-detts37kt2162911qjaomce02k38dqk1.apps.googleusercontent.com"
