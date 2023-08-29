import { NostrEvent, NostrPrefix, TaggedNostrEvent, createNostrLink, encodeTLV } from "@snort/system";
import * as utils from "@noble/curves/abstract/utils";
import { bech32 } from "@scure/base";
import type { Tag, Tags } from "types";
import { LIVE_STREAM } from "const";
import { unwrap } from "@snort/shared";

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

export function toTag(e: NostrEvent): Tag {
  if (e.kind && e.kind >= 30000 && e.kind <= 40000) {
    const dTag = findTag(e, "d");

    return ["a", `${e.kind}:${e.pubkey}:${dTag}`];
  }

  if (e.kind === 0 || e.kind === 3) {
    return ["p", e.pubkey];
  }

  return ["e", e.id];
}

export function findTag(e: NostrEvent | undefined, tag: string) {
  const maybeTag = e?.tags.find(evTag => {
    return evTag[0] === tag;
  });
  return maybeTag && maybeTag[1];
}

/**
 * Convert hex to bech32
 */
export function hexToBech32(hrp: string, hex?: string) {
  if (typeof hex !== "string" || hex.length === 0 || hex.length % 2 !== 0) {
    return "";
  }

  try {
    if (hrp === NostrPrefix.Note || hrp === NostrPrefix.PrivateKey || hrp === NostrPrefix.PublicKey) {
      const buf = utils.hexToBytes(hex);
      return bech32.encode(hrp, bech32.toWords(buf));
    } else {
      return encodeTLV(hrp as NostrPrefix, hex);
    }
  } catch (e) {
    console.warn("Invalid hex", hex, e);
    return "";
  }
}

export function splitByUrl(str: string) {
  const urlRegex =
    /((?:http|ftp|https|nostr|web\+nostr|magnet):\/?\/?(?:[\w+?.\w+])+(?:[a-zA-Z0-9~!@#$%^&*()_\-=+\\/?.:;',]*)?(?:[-A-Za-z0-9+&@#/%=~()_|]))/i;

  return str.split(urlRegex);
}

export function eventLink(ev: NostrEvent | TaggedNostrEvent) {
  if (ev.kind && ev.kind >= 30000 && ev.kind <= 40000) {
    const d = findTag(ev, "d") ?? "";
    return encodeTLV(NostrPrefix.Address, d, "relays" in ev ? ev.relays : undefined, ev.kind, ev.pubkey);
  } else {
    return encodeTLV(NostrPrefix.Event, ev.id, "relays" in ev ? ev.relays : undefined);
  }
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

export function eventToLink(ev: NostrEvent) {
  if (ev.kind >= 30_000 && ev.kind < 40_000) {
    const dTag = unwrap(findTag(ev, "d"));
    return createNostrLink(NostrPrefix.Address, dTag, undefined, ev.kind, ev.pubkey);
  }
  return createNostrLink(NostrPrefix.Event, ev.id, undefined, ev.kind, ev.pubkey);
}
