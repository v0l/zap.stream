import { base64 } from "@scure/base";
import { throwIfOffline } from "@snort/shared";
import { EventKind, EventPublisher } from "@snort/system";

import { FileExtensionRegex, UploadResult, readNip94Tags } from ".";

export class Nip96Uploader {
  constructor(
    readonly url: string,
    readonly publisher: EventPublisher,
  ) {
    this.url = new URL(this.url).toString();
  }

  get progress() {
    return [];
  }

  async loadInfo() {
    const u = new URL(this.url);

    const rsp = await fetch(`${u.protocol}//${u.host}/.well-known/nostr/nip96.json`);
    return (await rsp.json()) as Nip96Info;
  }

  async upload(file: File | Blob, filename: string): Promise<UploadResult> {
    throwIfOffline();
    const auth = async (url: string, method: string) => {
      const auth = await this.publisher.generic(eb => {
        return eb.kind(EventKind.HttpAuthentication).tag(["u", url]).tag(["method", method]);
      });
      return `Nostr ${base64.encode(new TextEncoder().encode(JSON.stringify(auth)))}`;
    };

    const info = await this.loadInfo();
    const fd = new FormData();
    fd.append("size", file.size.toString());
    fd.append("caption", filename);
    fd.append("media_type", file.type);
    fd.append("file", file);

    let u = info.api_url;
    if (u.startsWith("/")) {
      u = `${this.url}${u.slice(1)}`;
    }
    const rsp = await fetch(u, {
      body: fd,
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: await auth(u, "POST"),
      },
    });
    if (rsp.ok) {
      throwIfOffline();
      const data = (await rsp.json()) as Nip96Result;
      if (data.status === "success") {
        const meta = readNip94Tags(data.nip94_event.tags);
        if (
          meta.dimensions === undefined ||
          meta.dimensions.length !== 2 ||
          meta.dimensions[0] === 0 ||
          meta.dimensions[1] === 0
        ) {
          return {
            error: `Invalid dimensions: "${meta.dimensions?.join("x")}"`,
          };
        }
        if (!meta.url?.match(FileExtensionRegex) && meta.mimeType) {
          switch (meta.mimeType) {
            case "image/webp": {
              meta.url += ".webp";
              break;
            }
            default: {
              meta.url += ".jpg";
              break;
            }
          }
        }
        return {
          url: meta.url,
          metadata: meta,
        };
      }
      return {
        error: data.message,
      };
    } else {
      const text = await rsp.text();
      try {
        const obj = JSON.parse(text) as Nip96Result;
        return {
          error: obj.message,
        };
      } catch {
        return {
          error: `Upload failed: ${text}`,
        };
      }
    }
  }
}

export interface Nip96Info {
  api_url: string;
  download_url?: string;
}

export interface Nip96Result {
  status: string;
  message: string;
  processing_url?: string;
  nip94_event: {
    tags: Array<Array<string>>;
    content: string;
  };
}
