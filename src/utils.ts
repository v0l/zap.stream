import { CachedMetadata, NostrEvent, NostrLink, TaggedNostrEvent } from "@snort/system";

import type { Tags } from "@/types";
import { LIVE_STREAM, StreamState } from "@/const";
import { GameInfo } from "./service/game-database";
import { AllCategories } from "./pages/category";
import { hexToBech32 } from "@snort/shared";
import { StreamInfo } from "./element/stream/stream-info";

export function toAddress(e: NostrEvent): string {
  if (e.kind && e.kind >= 30000 && e.kind <= 40000) {
    const dTag = findTag(e, "d");

    return `${e.kind}:${e.pubkey}:${dTag}`;
  }

  if (e.kind === 0 || e.kind === 3) {
    return e.pubkey;
  }

  return e.id;
}

export function findTag(e: NostrEvent | undefined, tag: string) {
  const maybeTag = e?.tags.find(evTag => {
    return evTag[0] === tag;
  });
  return maybeTag && maybeTag[1];
}

export function eventLink(ev: NostrEvent | TaggedNostrEvent) {
  return NostrLink.fromEvent(ev).encode();
}

export function getHost(ev?: NostrEvent) {
  return ev?.tags.find(a => a[0] === "p" && a[3] === "host")?.[1] ?? ev?.pubkey ?? "";
}

export function profileLink(meta: CachedMetadata | undefined, pubkey: string) {
  if (meta && meta.nip05 && meta.nip05.endsWith("@zap.stream") && meta.isNostrAddressValid) {
    const [name] = meta.nip05.split("@");
    return `/p/${name}`;
  }
  return `/p/${hexToBech32("npub", pubkey)}`;
}

export function openFile(): Promise<File | undefined> {
  return new Promise(resolve => {
    const elm = document.createElement("input");
    elm.type = "file";
    elm.onchange = (e: Event) => {
      const elm = e.target as HTMLInputElement;
      if (elm.files) {
        resolve(elm.files[0]);
      } else {
        resolve(undefined);
      }
    };
    elm.click();
  });
}

export function getTagValues(tags: Tags, tag: string): Array<string> {
  return tags
    .filter(t => t.at(0) === tag)
    .map(t => t.at(1))
    .filter(t => t)
    .map(t => t as string);
}

export function getEventFromLocationState(state: unknown | undefined | null) {
  return state && typeof state === "object" && "kind" in state && state.kind === LIVE_STREAM
    ? (state as TaggedNostrEvent)
    : undefined;
}

export function uniqBy<T>(vals: Array<T>, key: (x: T) => string) {
  return Object.values(
    vals.reduce(
      (acc, v) => {
        const k = key(v);
        acc[k] ??= v;
        return acc;
      },
      {} as Record<string, T>,
    ),
  );
}

export function getPlaceholder(id: string) {
  return `https://nostr.api.v0l.io/api/v1/avatar/robots/${id}.webp`;
}

export function debounce(time: number, fn: () => void): () => void {
  const t = setTimeout(fn, time);
  return () => clearTimeout(t);
}

export interface StreamInfo {
  id?: string;
  title?: string;
  summary?: string;
  image?: string;
  thumbnail?: string;
  status?: StreamState;
  stream?: string;
  recording?: string;
  contentWarning?: string;
  tags: Array<string>;
  goal?: string;
  participants?: string;
  starts?: string;
  ends?: string;
  service?: string;
  host?: string;
  gameId?: string;
  gameInfo?: GameInfo;
  streams: Array<string>
}

const gameTagFormat = /^[a-z-]+:[a-z0-9-]+$/i;
export function extractStreamInfo(ev?: NostrEvent) {
  const ret = {
    host: getHost(ev),
  } as StreamInfo;
  const matchTag = (tag: Array<string>, k: string, into: (v: string) => void) => {
    if (tag[0] === k) {
      into(tag[1]);
    }
  };

  for (const t of ev?.tags ?? []) {
    matchTag(t, "d", v => (ret.id = v));
    matchTag(t, "title", v => (ret.title = v));
    matchTag(t, "summary", v => (ret.summary = v));
    matchTag(t, "image", v => (ret.image = v));
    matchTag(t, "thumbnail", v => (ret.thumbnail = v));
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
  const { regularTags, prefixedTags } = sortStreamTags(ev?.tags ?? []);
  ret.tags = regularTags;

  const { gameInfo, gameId } = extractGameTag(prefixedTags);
  ret.gameId = gameId;
  ret.gameInfo = gameInfo;

  if (ret.streams) {
    const isN94 = ret.streams.includes("nip94");
    if (isN94) {
      ret.stream = "nip94";
    } else {
      ret.stream = ret.streams.find(a => a.includes(".m3u8"));
    }
  }
  return ret;
}

export function sortStreamTags(tags: Array<string | Array<string>>) {
  const plainTags = tags.filter(a => (Array.isArray(a) ? a[0] === "t" : true)).map(a => (Array.isArray(a) ? a[1] : a));

  const regularTags = plainTags.filter(a => !a.match(gameTagFormat)) ?? [];
  const prefixedTags = plainTags.filter(a => !regularTags.includes(a));
  return { regularTags, prefixedTags };
}

export function extractGameTag(tags: Array<string>) {
  let gameInfo: GameInfo | undefined = undefined;
  const gameId = tags.find(a => a.match(gameTagFormat));
  if (gameId?.startsWith("internal:")) {
    const internal = AllCategories.find(a => gameId === `internal:${a.id}`);
    if (internal) {
      gameInfo = {
        id: internal?.id,
        name: internal.name,
        genres: internal.tags,
        className: internal.className,
      };
    }
  }
  if (gameId === undefined) {
    const lowerTags = tags.map(a => a.toLowerCase());
    const anyCat = AllCategories.find(a => a.tags.some(b => lowerTags.includes(b)));
    if (anyCat) {
      gameInfo = {
        id: anyCat?.id,
        name: anyCat.name,
        genres: anyCat.tags,
        className: anyCat.className,
      };
    }
  }
  return { gameInfo, gameId };
}

export function trackEvent(
  event: string,
  props?: Record<string, string | boolean>,
  e?: { destination?: { url: string } },
) {
  if (!import.meta.env.DEV) {
    fetch("https://pa.v0l.io/api/event", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        d: window.location.host,
        n: event,
        r: document.referrer === location.href ? null : document.referrer,
        p: props,
        u: e?.destination?.url ?? `${location.protocol}//${location.host}${location.pathname}`,
      }),
    });
  }
}

export function groupBy<T>(val: Array<T>, selector: (a: T) => string | number): Record<string, Array<T>> {
  return val.reduce(
    (acc, v) => {
      const key = selector(v);
      acc[key] ??= [];
      acc[key].push(v);
      return acc;
    },
    {} as Record<string, Array<T>>,
  );
}
