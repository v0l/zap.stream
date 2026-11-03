/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  EventKind,
  type NostrLink,
  type QueryLike,
  RequestBuilder,
  type SystemInterface,
  parseNostrLink,
} from "@snort/system"
import { type HTMLProps, useContext, useEffect, useRef } from "react"
import mpegts from "mpegts.js"
import { SnortContext } from "@snort/system-react"
import { findTag } from "@/utils"
import { MAX_SEGMENT_BYTES, readCapped } from "./n94-fetch"
import { sha256 } from "@noble/hashes/sha2.js"
import { bytesToHex } from "@noble/hashes/utils.js"

interface MediaSegment {
  created: number
  sha256: string
  url: string
  duration: number
  variant: string
  loaded: boolean
}

enum LoaderStatus {
  kIdle = 0,
  kConnecting = 1,
  kBuffering = 2,
  kError = 3,
  kComplete = 4,
}
class Nip94Loader implements mpegts.BaseLoader {
  #system!: SystemInterface
  #query?: QueryLike
  #mediaChunks: Map<string, MediaSegment> = new Map()
  #status: LoaderStatus = LoaderStatus.kIdle
  #bytes = 0
  #variant: string = ""

  constructor(_seekHandler: mpegts.SeekHandler, config: mpegts.Config) {
    if ("system" in config) {
      this.#system = config.system as SystemInterface
    } else {
      throw "Invalid config, missing system"
    }
  }

  // @ts-expect-error
  onContentLengthKnown: (contentLength: number) => void
  // @ts-expect-error
  onURLRedirect: (redirectedURL: string) => void
  // @ts-expect-error
  onDataArrival: (chunk: ArrayBuffer, byteStart: number, receivedLength?: number | undefined) => void
  // @ts-expect-error
  onError: (errorType: mpegts.LoaderErrors, errorInfo: mpegts.LoaderErrorMessage) => void
  // @ts-expect-error
  onComplete: (rangeFrom: number, rangeTo: number) => void

  get _status() {
    return this.#status
  }
  get status() {
    return this.#status
  }

  destroy(): void {
    this.abort()
  }

  isWorking(): boolean {
    return this.#status === LoaderStatus.kBuffering
  }

  type = "nip94"
  get needStashBuffer() {
    return false
  }
  get _needStash() {
    return this.needStashBuffer
  }

  open(dataSource: mpegts.MediaSegment) {
    const link = parseNostrLink(dataSource.url)
    if (!link) {
      throw new Error("Datasource.url is invalid")
    }

    const rb = new RequestBuilder(`n94-stream-${link.encode()}`)
    rb.withOptions({
      leaveOpen: true,
      skipCache: true,
    })
    const f = rb.withFilter().replyToLink([link]).kinds([EventKind.FileHeader]).limit(10)
    // segments must come from the stream's own author; replyToLink alone accepts anyone
    if (link.author) f.authors([link.author])

    this.#status = LoaderStatus.kConnecting
    this.#query = this.#system.Query(rb)
    this.#query.on("event", evs => {
      for (const ev of evs) {
        if (link.author && ev.pubkey !== link.author) continue
        const url = findTag(ev, "url")
        if (!url) continue
        const seg = {
          created: ev.created_at,
          url,
          sha256: findTag(ev, "x"),
          variant: findTag(ev, "d"),
        } as MediaSegment
        this.#addSegment(seg)
      }
      this.#loadNext()
    })
  }

  abort() {
    this.#query?.cancel()
  }

  #loading = false

  #addSegment(seg: MediaSegment) {
    // key on hash+url so a hostile event reusing a real x with another url can't shadow the genuine segment
    const key = `${seg.sha256 ?? ""}|${seg.url}`
    if (!this.#mediaChunks.has(key)) {
      this.#mediaChunks.set(key, seg)
    }
    if (!this.#variant) {
      this.#variant = seg.variant
    }
  }

  async #loadNext() {
    if (this.#status === LoaderStatus.kConnecting || this.#status === LoaderStatus.kIdle) {
      this.#status = LoaderStatus.kBuffering
    }
    if (this.#status !== LoaderStatus.kBuffering) {
      return
    }
    if (this.#loading) return
    // NIP-94 FileHeader events are attacker-authorable: the url can point
    // anywhere. Segment reads are capped and hash-verified (see readCapped /
    // the x-hash check below) before bytes reach the demuxer.
    this.#loading = true
    const orderedLoad = [...this.#mediaChunks.values()]
      .sort((a, b) => a.created - b.created)
      .filter(a => !a.loaded && a.variant === this.#variant)
    for (const s of orderedLoad) {
      s.loaded = true
      const ctl = new AbortController()
      try {
        const result = await fetch(s.url, { signal: ctl.signal })
        // skip 404
        if (result.status === 404) {
          continue
        }
        const bytes = await readCapped(result, MAX_SEGMENT_BYTES, () => ctl.abort())
        if (!bytes) {
          console.warn("n94 segment exceeds size cap, skipping", s.url)
          continue
        }

        // x is the integrity signal: mismatch => skip (playback gap, not hostile bytes)
        if (s.sha256) {
          const digest = bytesToHex(sha256(bytes))
          if (digest.toLowerCase() !== s.sha256.toLowerCase()) {
            console.warn("n94 segment hash mismatch, skipping", s.url)
            continue
          }
        }

        const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
        this.onDataArrival(buf, this.#bytes, buf.byteLength)
        this.#bytes += buf.byteLength
      } catch (e) {
        s.loaded = false
        console.warn("Failed to load chunk ", s, e)
      } finally {
        ctl.abort()
      }
    }
    this.#loading = false
    this.#status = LoaderStatus.kIdle
    if ([...this.#mediaChunks.values()].some(a => !a.loaded && a.variant === this.#variant)) {
      this.#loadNext()
    }
  }
}

type N94PlayerProps = {
  link: NostrLink
} & Omit<HTMLProps<HTMLVideoElement>, "ref">

export default function Nip94Player({ link, ...props }: N94PlayerProps) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const system = useContext(SnortContext)

  useEffect(() => {
    const videoElement = ref.current
    if (!videoElement) return

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
    )

    player.attachMediaElement(videoElement)
    player.load()
    player.play()

    // destroy the mpegts player on unmount / link change so it doesn't
    // keep streaming in the background
    return () => {
      player.destroy()
    }
  }, [link, system])

  return <video {...props} slot="media" ref={ref} playsInline={true} autoPlay={true}></video>
}
