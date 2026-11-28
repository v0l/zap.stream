/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  EventKind,
  type NostrLink,
  type QueryLike,
  RequestBuilder,
  type SystemInterface,
  type TaggedNostrEvent,
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
export class Nip94Loader implements mpegts.BaseLoader {
  #system!: SystemInterface
  #query?: QueryLike
  #link?: NostrLink
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

  #onEvents = (evs: Array<TaggedNostrEvent>) => {
    const link = this.#link
    if (!link) return
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
  }

  open(dataSource: mpegts.MediaSegment) {
    // detach a prior subscription so re-open cannot orphan a listener
    this.#cleanupQuery()

    const link = parseNostrLink(dataSource.url)
    if (!link) {
      throw new Error("Datasource.url is invalid")
    }
    this.#link = link

    const rb = new RequestBuilder(`n94-stream-${link.encode()}`)
    rb.withOptions({
      leaveOpen: true,
      skipCache: true,
    })
    const f = rb.withFilter().replyToLink([link]).kinds([EventKind.FileHeader]).limit(10)
    // segments must come from the stream's own author; replyToLink alone accepts anyone
    if (link.author) {
      f.authors([link.author])
    } else {
      // event-id links (nevent/note) carry no author — the author filter
      // cannot apply, so third-party segments are accepted for such links
      // (fail-open; documented in the PR).
      console.warn("n94: no author on stream link, accepting segments from any publisher")
    }

    this.#status = LoaderStatus.kConnecting
    this.#query = this.#system.Query(rb)

    // attach before starting so no emission is missed
    this.#query.on("event", this.#onEvents)
    // @snort/system 2.x creates queries without starting them (regression from
    // the snort 2.0 upgrade; 1.5.3 auto-started in the Query constructor) and
    // start() does not clear a pending cancel timestamp.
    this.#query.uncancel()
    this.#query.start()

    // Within the 1s cancel grace window QueryManager.query() reuses the
    // existing Query and skips start() when areFiltersCovered() returns true,
    // so the new listener would see nothing until the next live event. Seed
    // from the feed cache; hash+url dedupe makes overlap idempotent.
    const cached = this.#query.snapshot
    if (Array.isArray(cached) && cached.length > 0) {
      this.#onEvents(cached)
    }
  }

  #cleanupQuery() {
    // clear link state before the guard: a failed re-open (parseNostrLink
    // throwing) must never leave a stale link on the instance
    this.#link = undefined
    if (!this.#query) return
    this.#query.off("event", this.#onEvents)
    this.#query.cancel()
    this.#query = undefined
  }

  abort() {
    this.#cleanupQuery()
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

        const ab =
          bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
            ? bytes.buffer
            : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
        const buf = ab as ArrayBuffer
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
