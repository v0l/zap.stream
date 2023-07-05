import { NostrEvent, NostrPrefix, encodeTLV } from "@snort/system";
import * as utils from "@noble/curves/abstract/utils";
import { bech32 } from "@scure/base";

export function findTag(e: NostrEvent | undefined, tag: string) {
  const maybeTag = e?.tags.find((evTag) => {
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
    if (
      hrp === NostrPrefix.Note ||
      hrp === NostrPrefix.PrivateKey ||
      hrp === NostrPrefix.PublicKey
    ) {
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

export function eventLink(ev: NostrEvent) {
  const d = findTag(ev, "d") ?? "";
  const naddr = encodeTLV(
    NostrPrefix.Address,
    d,
    undefined,
    ev.kind,
    ev.pubkey
  );
  return `/${naddr}`;
}

export function getHost(ev?: NostrEvent) {
  return ev?.tags.find(a => a[0] === "p" && a[3] === "host")?.[1] ?? ev?.pubkey ?? "";
}