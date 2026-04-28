import type { NostrEvent } from "./types";
import type { StreamInfo } from "./provider";
import type { StreamState } from "./constants";

/**
 * Find the first value of a given tag name in a Nostr event.
 */
export function findTag(e: NostrEvent | undefined, tag: string): string | undefined {
  const maybeTag = e?.tags.find(evTag => evTag[0] === tag);
  return maybeTag?.[1];
}

const gameTagFormat = /^[a-z-]+:[a-z0-9-]+$/i;

/**
 * Sort tags into regular tags and prefixed (game) tags.
 */
export function sortStreamTags(tags: Array<string | Array<string>>) {
  const plainTags = tags
    .filter(a => (Array.isArray(a) ? a[0] === "t" : true))
    .map(a => (Array.isArray(a) ? a[1] : a));

  const regularTags = plainTags.filter(a => !a.match(gameTagFormat)) ?? [];
  const prefixedTags = plainTags.filter(a => !regularTags.includes(a));
  return { regularTags, prefixedTags };
}

/**
 * Extract the game ID from prefixed tags.
 * Returns the gameId string (or undefined) — game info resolution
 * is left to the consumer.
 */
export function extractGameId(tags: Array<string>): { gameId: string | undefined; gameTag: string | undefined } {
  const gameId = tags.find(a => a.match(gameTagFormat));
  return { gameId, gameTag: gameId };
}

/**
 * Extract structured stream info from a Nostr live-stream event (kind 30311 or 1053).
 *
 * This is a framework-agnostic version of the extractor. It does not resolve
 * `gameInfo` (since that requires UI-layer category data) — consumers can
 * look up game details via `GameDatabase.getGame()`.
 */
export function extractStreamInfo(ev?: NostrEvent): StreamInfo {
  const ret = {
    tags: [],
    streams: [],
  } as StreamInfo;
  if (!ev) return ret;

  const host = findTag(ev, "p") ?? ev.pubkey;
  ret.host = host;

  const matchTag = (tag: Array<string>, k: string, into: (v: string) => void) => {
    if (tag[0] === k) {
      into(tag[1]);
    }
  };

  for (const t of ev.tags ?? []) {
    matchTag(t, "d", v => (ret.id = v));
    matchTag(t, "title", v => (ret.title = v));
    matchTag(t, "summary", v => (ret.summary = v));
    matchTag(t, "image", v => (ret.image = v));
    matchTag(t, "thumb", v => (ret.thumbnail = v));
    matchTag(t, "status", v => (ret.status = v as StreamState));
    if (t[0] === "streaming") {
      ret.streams ??= [];
      ret.streams.push(t[1]);
    }
    matchTag(t, "recording", v => (ret.recording = v));
    matchTag(t, "url", v => (ret.recording = v));
    matchTag(t, "content-warning", v => (ret.contentWarning = v));
    matchTag(t, "current_participants", v => (ret.participants = v));
    matchTag(t, "goal", v => (ret.goal = v));
    matchTag(t, "starts", v => (ret.starts = v));
    matchTag(t, "ends", v => (ret.ends = v));
    matchTag(t, "service", v => (ret.service = v));
  }

  const { regularTags, prefixedTags } = sortStreamTags(ev.tags ?? []);
  ret.tags = regularTags;

  const { gameId } = extractGameId(prefixedTags);
  ret.gameId = gameId;

  if (ret.streams.length > 0) {
    ret.stream = ret.streams.find(a => a.includes(".m3u8")) || ret.streams.at(0);
  }
  return ret;
}
