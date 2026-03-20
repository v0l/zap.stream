/* eslint-disable @typescript-eslint/ban-ts-comment */
import { EventKind, type NostrLink, type QueryLike, RequestBuilder, type SystemInterface, parseNostrLink } from "@snort/system";
import { type HTMLProps, useContext, useEffect, useRef } from "react";
import mpegts from "mpegts.js";
import { SnortContext } from "@snort/system-react";
import { findTag } from "@/utils";

interface MediaSegment {
  created: number;
  sha256: string;
  url: string;
  duration: number;
  variant: string;
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
  #variant: string = "";

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
    return this.#status === LoaderStatus.kBuffering;
  }

  type = "nip94";
  get needStashBuffer() {
    return false;
  }
  get _needStash() {
    return this.needStashBuffer;
  }

  open(dataSource: mpegts.MediaSegment) {
    const link = parseNostrLink(dataSource.url);
    if (!link) {
      throw new Error("Datasource.url is invalid");
    }

    const rb = new RequestBuilder(`n94-stream-${link.encode()}`);
    rb.withOptions({
      leaveOpen: true,
      skipCache: true,
    });
    rb.withFilter().replyToLink([link]).kinds([EventKind.FileHeader]).limit(10);

    this.#status = LoaderStatus.kConnecting;
    this.#query = this.#system.Query(rb);
    this.#query.on("event", evs => {
      for (const ev of evs) {
        const seg = {
          created: ev.created_at,
          url: findTag(ev, "url")!,
          sha256: findTag(ev, "x")!,
          variant: findTag(ev, "d")!,
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
    if (!this.#variant) {
      this.#variant = seg.variant;
    }
  }

  async #loadNext() {
    if (this.#status === LoaderStatus.kConnecting || this.#status === LoaderStatus.kIdle) {
      this.#status = LoaderStatus.kBuffering;
    }
    if (this.#status !== LoaderStatus.kBuffering) {
      return;
    }
    const orderedLoad = [...this.#mediaChunks.values()]
      .sort((a, b) => a.created - b.created)
      .filter(a => !a.loaded && a.variant === this.#variant);
    for (const s of orderedLoad) {
      try {
        const result = await fetch(s.url);
        // skip 404
        if (result.status === 404) {
          s.loaded = true;
          continue;
        }
        const buf = await result.arrayBuffer();

        this.onDataArrival(buf, this.#bytes, buf.byteLength);
        console.debug("pushing bytes", this.#bytes, buf.byteLength);
        this.#bytes += buf.byteLength;

        this.#mediaChunks.set(s.sha256, {
          ...s,
          loaded: true,
        });
      } catch (e) {
        console.warn("Failed to load chunk ", s, e);
      }
    }
    this.#status = LoaderStatus.kIdle;
  }
}

type N94PlayerProps = {
  link: NostrLink;
} & Omit<HTMLProps<HTMLVideoElement>, "ref">;

export default function Nip94Player({ link, ...props }: N94PlayerProps) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const system = useContext(SnortContext);

  useEffect(() => {
    const videoElement = ref.current;

    if (!videoElement) return;

    // Destroy any existing player before creating a new one
    if ((videoElement as any).__streamer) {
      (videoElement as any).__streamer.destroy();
    }

    // Create new player
    const player = new mpegts.MSEPlayer(
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

    (videoElement as any).__streamer = player;
    player.attachMediaElement(videoElement);
    player.load();
    player.play();

    // Cleanup function to destroy the mpegts player when component unmounts
    return () => {
      if (player) {
        player.destroy();
        (videoElement as any).__streamer = undefined;
      }
    };
  }, [link]);

  return <video {...props} slot="media" ref={ref} playsInline={true} autoPlay={true}></video>;
}
