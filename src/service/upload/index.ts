import { bytesToHex } from "@noble/hashes/utils.js";
import { base64 } from "@scure/base";
import { adaptPublisher } from "@/providers";
import { compressImage } from "./image-compression";
import type { EventPublisher } from "@snort/system";
import type { Signer } from "@zap.stream/api";
import { throwIfOffline, unixNow, buildUnsignedEvent } from "@zap.stream/api";

export const FileExtensionRegex = /\.([\w]{1,7})$/i;

const BLOSSOM_AUTH_KIND = 24_242;

export interface BlobDescriptor {
  url?: string;
  sha256: string;
  size: number;
  type?: string;
  uploaded?: number;
  nip94?: Array<Array<string>>;
}

export class Blossom {
  readonly url: string;
  readonly #signer: Signer;

  constructor(url: string, pub: EventPublisher) {
    this.url = new URL(url).toString();
    this.#signer = adaptPublisher(pub);
  }

  async uploadImage(file: File, maxWidth = 512, maxHeight = 512) {
    const compressed = await compressImage(file, maxWidth, maxHeight);
    return await this.upload(compressed);
  }

  async upload(file: File | Blob): Promise<BlobDescriptor> {
    const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    const tags = [["x", bytesToHex(new Uint8Array(hash))]];

    const rsp = await this.#req("upload", "PUT", "upload", file as BodyInit, tags);
    if (rsp.ok) {
      const json = await rsp.json();
      if ("error" in json && typeof json.error === "string") {
        throw new Error(json.error);
      }
      const ret = json as BlobDescriptor;
      this.#fixTags(ret);
      return ret;
    } else {
      const text = await rsp.text();
      throw new Error(text);
    }
  }

  async media(file: File | Blob): Promise<BlobDescriptor> {
    const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    const tags = [["x", bytesToHex(new Uint8Array(hash))]];

    const rsp = await this.#req("media", "PUT", "media", file as BodyInit, tags);
    if (rsp.ok) {
      const ret = (await rsp.json()) as BlobDescriptor;
      this.#fixTags(ret);
      return ret;
    } else {
      const text = await rsp.text();
      throw new Error(text);
    }
  }

  async mirror(url: string): Promise<BlobDescriptor> {
    const rsp = await this.#req("mirror", "PUT", "mirror", JSON.stringify({ url }), undefined, {
      "content-type": "application/json",
    });
    if (rsp.ok) {
      const ret = (await rsp.json()) as BlobDescriptor;
      this.#fixTags(ret);
      return ret;
    } else {
      const text = await rsp.text();
      throw new Error(text);
    }
  }

  async list(pk: string): Promise<Array<BlobDescriptor>> {
    const rsp = await this.#req(`list/${pk}`, "GET", "list");
    if (rsp.ok) {
      const ret = (await rsp.json()) as Array<BlobDescriptor>;
      ret.forEach(a => this.#fixTags(a));
      return ret;
    } else {
      const text = await rsp.text();
      throw new Error(text);
    }
  }

  async delete(id: string): Promise<void> {
    const tags = [["x", id]];
    const rsp = await this.#req(id, "DELETE", "delete", undefined, tags);
    if (!rsp.ok) {
      const text = await rsp.text();
      throw new Error(text);
    }
  }

  #fixTags(r: BlobDescriptor) {
    if (!r.nip94) return;
    if (Array.isArray(r.nip94)) return;
    if (r.nip94 && "tags" in r.nip94) {
      r.nip94 = r.nip94["tags"];
      return;
    }
    r.nip94 = Object.entries(r.nip94 as Record<string, string>);
  }

  async #req(
    path: string,
    method: "GET" | "POST" | "DELETE" | "PUT",
    term: string,
    body?: BodyInit,
    extraTags?: Array<Array<string>>,
    headers?: Record<string, string>,
  ) {
    throwIfOffline();

    const url = `${this.url}${path}`;
    const now = unixNow();
    const auth = async (url: string, method: string) => {
      const tags: Array<Array<string>> = [
        ["u", url],
        ["method", method.toLowerCase()],
        ["t", term],
        ["expiration", (now + 10).toString()],
      ];
      if (extraTags) {
        tags.push(...extraTags);
      }
      const pubkey = await this.#signer.getPubKey();
      const unsigned = buildUnsignedEvent(pubkey, BLOSSOM_AUTH_KIND, tags, "", now);
      const signed = await this.#signer.sign(unsigned);
      return `Nostr ${base64.encode(new TextEncoder().encode(JSON.stringify(signed)))}`;
    };

    return await fetch(url, {
      method,
      body,
      headers: {
        ...headers,
        accept: "application/json",
        authorization: await auth(url, method),
      },
    });
  }
}
