import { NostrEvent, NostrLink, TaggedNostrEvent } from "@snort/system";

import type { Tags } from "@/types";
import { LIVE_STREAM } from "@/const";

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

export function splitByUrl(str: string) {
  const urlRegex =
    /((?:http|ftp|https|nostr|web\+nostr|magnet):\/?\/?(?:[\w+?.\w+])+(?:[a-zA-Z0-9~!@#$%^&*()_\-=+\\/?.:;',]*)?(?:[-A-Za-z0-9+&@#/%=~()_|]))/i;

  return str.split(urlRegex);
}

export function eventLink(ev: NostrEvent | TaggedNostrEvent) {
  return NostrLink.fromEvent(ev).encode();
}

export function getHost(ev?: NostrEvent) {
  return ev?.tags.find(a => a[0] === "p" && a[3] === "host")?.[1] ?? ev?.pubkey ?? "";
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
    ? (state as NostrEvent)
    : undefined;
}

export function uniqBy<T>(vals: Array<T>, key: (x: T) => string) {
  return Object.values(
    vals.reduce((acc, v) => {
      const k = key(v);
      acc[k] ??= v;
      return acc;
    }, {} as Record<string, T>)
  );
}

export function getPlaceholder(id: string) {
  return `https://robohash.v0l.io/${id}.png`;
}
