import { afterEach, describe, expect, it, mock } from "bun:test"
import type mpegts from "mpegts.js"
import { EventKind, NostrLink, type SystemInterface, type TaggedNostrEvent } from "@snort/system"
import { NostrPrefix } from "@snort/shared"
import { Nip94Loader } from "./n94-player"

type EventHandler = (evs: Array<TaggedNostrEvent>) => void

class FakeQuery {
  calls: Array<string> = []
  snapshot: Array<TaggedNostrEvent> | undefined
  #listeners = new Set<EventHandler>()

  constructor(initialSnapshot?: Array<TaggedNostrEvent>) {
    this.snapshot = initialSnapshot
  }

  on(event: string, fn: EventHandler) {
    if (event === "event") {
      this.calls.push("on:event")
      this.#listeners.add(fn)
    }
  }

  off(event: string, fn: EventHandler) {
    if (event === "event") {
      this.calls.push("off:event")
      this.#listeners.delete(fn)
    }
  }

  uncancel() {
    this.calls.push("uncancel")
  }

  start() {
    this.calls.push("start")
  }

  cancel() {
    this.calls.push("cancel")
  }

  emitEvents(evs: Array<TaggedNostrEvent>) {
    for (const fn of Array.from(this.#listeners)) {
      fn(evs)
    }
  }

  get listenerCount() {
    return this.#listeners.size
  }
}

// sha256 of the empty string — matches the empty body the fetch spy returns
const EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

function makeSegmentEvent(id: string, url: string, pubkey: string): TaggedNostrEvent {
  return {
    id,
    pubkey,
    created_at: 1700000000,
    kind: EventKind.FileHeader,
    content: "",
    sig: "0".repeat(128),
    relays: ["wss://relay.example"],
    tags: [
      ["url", url],
      ["m", "video/mp2t"],
      ["x", EMPTY_SHA256],
    ],
  }
}

// encode() builds a checksum-valid naddr whose author is TEST_PUBKEY, so the
// loader's author filter at n94-player.tsx accepts makeSegmentEvent's events
const TEST_PUBKEY = "a".repeat(64)
const TEST_LINK = new NostrLink(NostrPrefix.Address, "n94-test-stream", EventKind.LiveEvent, TEST_PUBKEY)
const TEST_NADDR_URL = TEST_LINK.encode()

const noop = () => {}

// mpegts assigns these before open() in production; stubs keep #loadNext
// hermetic (otherwise a fetched segment hits the catch/retry path forever)
function attachCallbacks(loader: Nip94Loader, onDataArrival: () => void = noop) {
  Object.assign(loader, {
    onDataArrival,
    onError: noop,
    onComplete: noop,
  })
  return loader
}

function makeLoader(system: SystemInterface, onDataArrival?: () => void) {
  return attachCallbacks(new Nip94Loader(undefined as never, { system } as unknown as mpegts.Config), onDataArrival)
}

function makeSystem(query: FakeQuery) {
  return { Query: mock(() => query) } as unknown as SystemInterface
}

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

function createFetchSpy() {
  const fetchSpy = mock(async (_url: string) => new Response(new Uint8Array(), { status: 200 }))
  globalThis.fetch = fetchSpy as unknown as typeof fetch
  return fetchSpy
}

describe("Nip94Loader query lifecycle", () => {
  it("attaches the event handler before calling uncancel() and start() on first mount", () => {
    const query = new FakeQuery([])
    const system = makeSystem(query)
    const loader = makeLoader(system)
    createFetchSpy()

    loader.open({ url: TEST_NADDR_URL } as unknown as mpegts.MediaSegment)

    expect(system.Query).toHaveBeenCalledTimes(1)
    expect(query.calls).toEqual(["on:event", "uncancel", "start"])
    expect(query.listenerCount).toBe(1)

    loader.abort()
  })

  it("completes open() cleanly when query.snapshot is undefined", () => {
    const query = new FakeQuery(undefined)
    const loader = makeLoader(makeSystem(query))
    createFetchSpy()

    expect(() => loader.open({ url: TEST_NADDR_URL } as unknown as mpegts.MediaSegment)).not.toThrow()
    expect(query.calls).toEqual(["on:event", "uncancel", "start"])

    loader.abort()
  })

  it("drains only author-matched cached segments and fetches the exact url once", async () => {
    // first event carries a spoofed pubkey — the author filter must reject it
    const spoofed = makeSegmentEvent("spoofed", "https://evil.example/seg.ts", "b".repeat(64))
    const cachedSeg = makeSegmentEvent("seg-1", "https://cdn.example/seg1.ts", TEST_PUBKEY)
    const query = new FakeQuery([spoofed, cachedSeg])
    const loader = makeLoader(makeSystem(query))
    const fetchSpy = createFetchSpy()

    // resolve only when onDataArrival fires, so #loadNext has fully consumed
    // the segment (fetch + sha256 + delivery) before assertions run — no bare
    // microtask flush, and the spy proves exactly one delivery happened
    let arrival: () => void = noop
    const arrived = new Promise<void>(resolve => {
      arrival = resolve
    })
    const onDataArrival = mock(() => {
      arrival()
    })
    Object.assign(loader, { onDataArrival, onError: noop, onComplete: noop })

    loader.open({ url: TEST_NADDR_URL } as unknown as mpegts.MediaSegment)
    await arrived

    expect(query.calls).toEqual(["on:event", "uncancel", "start"])
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0][0]).toBe("https://cdn.example/seg1.ts")
    expect(onDataArrival).toHaveBeenCalledTimes(1)

    loader.abort()
  })

  it("detaches its event listener on abort() so a surviving shared query cannot trigger fetches", async () => {
    const query = new FakeQuery([])
    const loader = makeLoader(makeSystem(query))
    const fetchSpy = createFetchSpy()

    loader.open({ url: TEST_NADDR_URL } as unknown as mpegts.MediaSegment)
    loader.abort()

    expect(query.listenerCount).toBe(0)
    expect(query.calls).toContain("off:event")
    expect(query.calls).toContain("cancel")

    // simulate the shared Query surviving QueryManager's 1s grace window and
    // receiving a new event
    query.emitEvents([makeSegmentEvent("seg-2", "https://cdn.example/seg2.ts", TEST_PUBKEY)])
    await Promise.resolve()

    expect(fetchSpy).toHaveBeenCalledTimes(0)
  })

  it("keeps a destroyed loader silent while a remounted loader on the same query receives new events", async () => {
    const sharedQuery = new FakeQuery([])
    const system = { Query: mock(() => sharedQuery) } as unknown as SystemInterface
    const fetchSpy = createFetchSpy()

    // distinct arrival spies: a leaked first loader would call firstOnData and
    // double-count fetches; a dropped second loader would hang secondArrived
    const firstOnData = mock(noop)
    let notifySecond: () => void = noop
    const secondArrived = new Promise<void>(resolve => {
      notifySecond = resolve
    })
    const secondOnData = mock(() => {
      notifySecond()
    })

    const firstLoader = makeLoader(system, firstOnData)
    firstLoader.open({ url: TEST_NADDR_URL } as unknown as mpegts.MediaSegment)
    firstLoader.abort()

    const secondLoader = makeLoader(system, () => secondOnData())
    secondLoader.open({ url: TEST_NADDR_URL } as unknown as mpegts.MediaSegment)

    expect(sharedQuery.listenerCount).toBe(1)

    sharedQuery.emitEvents([makeSegmentEvent("seg-3", "https://cdn.example/seg3.ts", TEST_PUBKEY)])
    await secondArrived

    expect(firstOnData).not.toHaveBeenCalled()
    expect(secondOnData).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    secondLoader.abort()
    expect(sharedQuery.listenerCount).toBe(0)
  })

  it("re-open detaches the first query (off + cancel) and subscribes only to the new one", () => {
    const firstQuery = new FakeQuery([])
    const secondQuery = new FakeQuery([])
    const queries = [firstQuery, secondQuery]
    const system = { Query: mock(() => queries.shift()) } as unknown as SystemInterface
    const loader = makeLoader(system)
    createFetchSpy()

    loader.open({ url: TEST_NADDR_URL } as unknown as mpegts.MediaSegment)
    loader.open({ url: TEST_NADDR_URL } as unknown as mpegts.MediaSegment)

    expect(firstQuery.calls).toContain("off:event")
    expect(firstQuery.calls).toContain("cancel")
    expect(firstQuery.listenerCount).toBe(0)
    expect(secondQuery.calls).toEqual(["on:event", "uncancel", "start"])
    expect(secondQuery.listenerCount).toBe(1)

    loader.abort()
  })

  it("clears stale link state when a later open() throws, so late events fetch nothing", () => {
    const query = new FakeQuery([])
    const loader = makeLoader(makeSystem(query))
    const fetchSpy = createFetchSpy()

    loader.open({ url: TEST_NADDR_URL } as unknown as mpegts.MediaSegment)
    expect(() => loader.open({ url: "not-a-nostr-link" } as unknown as mpegts.MediaSegment)).toThrow()
    // the failed re-open cleaned up the first subscription; the loader is inert
    query.emitEvents([makeSegmentEvent("seg-4", "https://cdn.example/seg4.ts", TEST_PUBKEY)])

    expect(query.listenerCount).toBe(0)
    expect(fetchSpy).toHaveBeenCalledTimes(0)

    loader.abort()
  })
})
