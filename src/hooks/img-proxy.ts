import * as utils from "@noble/curves/abstract/utils";
import { base64 } from "@scure/base";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";
import { unwrap } from "@snort/shared";

export const DefaultImgProxy = {
  url: "https://imgproxy.snort.social",
  key: "a82fcf26aa0ccb55dfc6b4bd6a1c90744d3be0f38429f21a8828b43449ce7cebe6bdc2b09a827311bef37b18ce35cb1e6b1c60387a254541afa9e5b4264ae942",
  salt: "a897770d9abf163de055e9617891214e75a9016d748f8ef865e6ffbcb9ed932295659549773a22a019a5f06d0b440c320be411e3fddfe784e199e4f03d74bd9b",
};

export function hmacSha256(key: Uint8Array, ...messages: Uint8Array[]) {
  return hmac(sha256, key, utils.concatBytes(...messages));
}

export interface ImgProxySettings {
  url: string;
  key: string;
  salt: string;
}

export default function useImgProxy() {
  const imgProxyConfig = DefaultImgProxy;

  return {
    proxy: (url: string, resize?: number, sha256?: string) => proxyImg(url, imgProxyConfig, resize, sha256),
  };
}

export function proxyImg(url: string, settings?: ImgProxySettings, resize?: number, sha256?: string) {
  const te = new TextEncoder();
  function urlSafe(s: string) {
    return s.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  }

  function signUrl(u: string) {
    const result = hmacSha256(
      utils.hexToBytes(unwrap(settings).key),
      utils.hexToBytes(unwrap(settings).salt),
      te.encode(u),
    );
    return urlSafe(base64.encode(result));
  }
  if (!settings) return url;
  if (url.startsWith("data:") || url.startsWith("blob:") || url.length == 0) return url;
  const opts = [];
  if (sha256) {
    opts.push(`hs:sha256:${sha256}`);
  }
  if (resize) {
    opts.push(`rs:fit:${resize}:${resize}`);
    opts.push(`dpr:${window.devicePixelRatio}`);
  }
  const urlBytes = te.encode(url);
  const urlEncoded = urlSafe(base64.encode(urlBytes));
  const path = `/${opts.join("/")}/${urlEncoded}`;
  const sig = signUrl(path);
  return `${new URL(settings.url).toString()}${sig}${path}`;
}
