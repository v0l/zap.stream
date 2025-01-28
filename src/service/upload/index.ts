import { NostrEvent } from "@snort/system";

export const FileExtensionRegex = /\.([\w]{1,7})$/i;

export interface Nip94Tags {
  url?: string;
  mimeType?: string;
  hash?: string;
  originalHash?: string;
  size?: number;
  dimensions?: [number, number];
  magnet?: string;
  blurHash?: string;
  thumb?: string;
  image?: Array<string>;
  summary?: string;
  alt?: string;
  fallback?: Array<string>;
  duration?: number;
  bitrate?: number;
}

export interface UploadResult {
  url?: string;
  error?: string;

  /**
   * NIP-94 File Header
   */
  header?: NostrEvent;

  /**
   * Media metadata
   */
  metadata?: Nip94Tags;
}

/**
 * Read NIP-94 tags from `imeta` tag
 */
export function readNip94TagsFromIMeta(tag: Array<string>) {
  const asTags = tag.slice(1).map(a => a.split(" ", 2));
  return readNip94Tags(asTags);
}

/**
 * Read NIP-94 tags from event tags
 */
export function readNip94Tags(tags: Array<Array<string>>) {
  const res: Nip94Tags = {};
  for (const tx of tags) {
    const [k, v] = tx;
    switch (k) {
      case "url": {
        res.url = v;
        break;
      }
      case "m": {
        res.mimeType = v;
        break;
      }
      case "x": {
        res.hash = v;
        break;
      }
      case "ox": {
        res.originalHash = v;
        break;
      }
      case "size": {
        res.size = Number(v);
        break;
      }
      case "dim": {
        res.dimensions = v.split("x").map(Number) as [number, number];
        break;
      }
      case "magnet": {
        res.magnet = v;
        break;
      }
      case "blurhash": {
        res.blurHash = v;
        break;
      }
      case "thumb": {
        res.thumb = v;
        break;
      }
      case "image": {
        res.image ??= [];
        res.image.push(v);
        break;
      }
      case "summary": {
        res.summary = v;
        break;
      }
      case "alt": {
        res.alt = v;
        break;
      }
      case "fallback": {
        res.fallback ??= [];
        res.fallback.push(v);
        break;
      }
      case "duration": {
        res.duration = Number(v);
        break;
      }
      case "bitrate": {
        res.bitrate = Number(v);
        break;
      }
    }
  }
  return res;
}

export function nip94TagsToIMeta(meta: Nip94Tags) {
  const ret: Array<string> = ["imeta"];
  const ifPush = (key: string, value?: string | number) => {
    if (value) {
      ret.push(`${key} ${value}`);
    }
  };
  ifPush("url", meta.url);
  ifPush("m", meta.mimeType);
  ifPush("x", meta.hash);
  ifPush("ox", meta.originalHash);
  ifPush("size", meta.size);
  ifPush("dim", meta.dimensions?.join("x"));
  ifPush("magnet", meta.magnet);
  ifPush("blurhash", meta.blurHash);
  ifPush("thumb", meta.thumb);
  ifPush("summary", meta.summary);
  ifPush("alt", meta.alt);
  ifPush("duration", meta.duration);
  ifPush("bitrate", meta.bitrate);
  if (meta.image) {
    meta.image.forEach(a => ifPush("image", a));
  }
  if (meta.fallback) {
    meta.fallback.forEach(a => ifPush("fallback", a));
  }

  return ret;
}
