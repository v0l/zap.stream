/* eslint-disable @typescript-eslint/ban-ts-comment */
import { EventKind, NostrLink, QueryLike, RequestBuilder, SystemInterface, parseNostrLink } from "@snort/system";
import { useContext, useEffect, useRef } from "react";
import mpegts from "mpegts.js";
import { SnortContext } from "@snort/system-react";
import { findTag } from "@/utils";

interface MediaSegment {
  created: number;
  sha256: string;
  url: string;
  duration: number;
  loaded: boolean;
}

enum LoaderStatus {
  kIdle = 0,
  kConnecting = 1,
  kBuffering = 2,
  kError = 3,
  kComplete = 4,
}
class Nip94Loader implements mpegts.BaseLoader {
  #system!: SystemInterface;
  #query?: QueryLike;
  #mediaChunks: Map<string, MediaSegment> = new Map();
  #status: LoaderStatus = LoaderStatus.kIdle;
  #bytes = 0;

  constructor(_seekHandler: mpegts.SeekHandler, config: mpegts.Config) {
    if ("system" in config) {
      this.#system = config.system as SystemInterface;
    } else {
      throw "Invalid config, missing system";
    }
  }

  // @ts-expect-error
  onContentLengthKnown: (contentLength: number) => void;
  // @ts-expect-error
  onURLRedirect: (redirectedURL: string) => void;
  // @ts-expect-error
  onDataArrival: (chunk: ArrayBuffer, byteStart: number, receivedLength?: number | undefined) => void;
  // @ts-expect-error
  onError: (errorType: mpegts.LoaderErrors, errorInfo: mpegts.LoaderErrorMessage) => void;
  // @ts-expect-error
  onComplete: (rangeFrom: number, rangeTo: number) => void;

  get _status() {
    return this.#status;
  }
  get status() {
    return this.#status;
  }

  destroy(): void {
    throw new Error("Method not implemented.");
  }

  isWorking(): boolean {
    throw new Error("Method not implemented.");
  }

  type = "nip94";
  get needStashBuffer() {
    return false;
  }
  get _needStash() {
    return this.needStashBuffer;
  }

  open(dataSource: mpegts.MediaSegment, range: mpegts.Range) {
    const link = parseNostrLink(dataSource.url);
    if (!link) {
      throw new Error("Datasource.url is invalid");
    }

    const rb = new RequestBuilder(`n94-stream-${link.encode()}`);
    rb.withOptions({
      leaveOpen: true,
    });
    rb.withFilter().replyToLink([link]).kinds([EventKind.FileHeader]);

    this.#status = LoaderStatus.kConnecting;
    this.#query = this.#system.Query(rb);
    this.#query.on("event", evs => {
      for (const ev of evs) {
        const seg = {
          created: ev.created_at,
          url: findTag(ev, "url")!,
          sha256: findTag(ev, "x")!,
        } as MediaSegment;
        this.#addSegment(seg);
      }
      this.#loadNext();
    });
  }

  abort() {
    this.#query?.cancel();
  }

  #addSegment(seg: MediaSegment) {
    if (!this.#mediaChunks.has(seg.sha256)) {
      this.#mediaChunks.set(seg.sha256, seg);
    }
  }

  async #loadNext() {
    if (this.#status === LoaderStatus.kConnecting || this.#status === LoaderStatus.kIdle) {
      this.#status = LoaderStatus.kBuffering;
    }
    if (this.#status !== LoaderStatus.kBuffering) {
      return;
    }
    const orderedLoad = [...this.#mediaChunks.values()].sort((a, b) => a.created - b.created).filter(a => !a.loaded);
    for (const s of orderedLoad) {
      const result = await fetch(s.url);
      const buf = await result.arrayBuffer();

      this.onDataArrival(buf, this.#bytes, buf.byteLength);
      console.debug("pushing bytes", this.#bytes, buf.byteLength);
      this.#bytes += buf.byteLength;

      this.#mediaChunks.set(s.sha256, {
        ...s,
        loaded: true,
      });
    }
    this.#status = LoaderStatus.kIdle;
  }
}

export default function Nip94Player({ link }: { link: NostrLink }) {
  const ref = useRef(null);
  const system = useContext(SnortContext);

  useEffect(() => {
    if (ref.current) {
      const player = ref.current as HTMLVideoElement & {
        __streamer?: mpegts.Player;
      };

      if (!player.__streamer) {
        player.__streamer = new mpegts.MSEPlayer(
          {
            type: "mse",
            isLive: true,
            url: link.encode(),
          },
          {
            system,
            customLoader: Nip94Loader,
          } as unknown as mpegts.Config,
        );

        player.__streamer.attachMediaElement(player);
        player.__streamer.load();
        player.__streamer.play();
      }
    }
  }, [ref]);

  return <video slot="media" ref={ref}></video>;
}
