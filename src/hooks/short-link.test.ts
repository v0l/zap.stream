import { afterEach, expect, test } from "bun:test"
import type { NostrEvent } from "@snort/system"
import { N94_LIVE_STREAM } from "@/const"
import { fetchShortName, shortLinkFor } from "./short-link"

const nogood = "55f04590674f3648f4cdc9dc8ce32da2a282074cd0b020596ee033d12d385185"
const realFetch = globalThis.fetch
let calls = 0

afterEach(() => {
  globalThis.fetch = realFetch
  calls = 0
})

function stream(status: string, kind = 30311): NostrEvent {
  return {
    id: "1".repeat(64),
    pubkey: nogood,
    kind,
    created_at: 1,
    tags: [
      ["d", "abc"],
      ["status", status],
    ],
    content: "",
    sig: "",
  }
}

function serveNames(names: Record<string, string>) {
  globalThis.fetch = (async () => {
    calls++
    return Response.json({ names })
  }) as unknown as typeof fetch
}

test("short name is the zap.stream name registered to the pubkey", async () => {
  serveNames({ nogood })
  expect(await fetchShortName(nogood, "zap.stream")).toBe("nogood")
})

test("short name ignores names registered to someone else", async () => {
  serveNames({ other: "2".repeat(64) })
  expect(await fetchShortName("3".repeat(64), "zap.stream")).toBeUndefined()
})

test("concurrent lookups for one pubkey share a request", async () => {
  serveNames({ thegrinder: "4".repeat(64) })
  const all = await Promise.all([1, 2, 3].map(() => fetchShortName("4".repeat(64), "zap.stream")))
  expect(all).toEqual(["thegrinder", "thegrinder", "thegrinder"])
  expect(calls).toBe(1)
})

test("live streams link by short name, ended streams keep the naddr", () => {
  expect(shortLinkFor(stream("live"), "nogood")).toBe("/nogood")
  expect(shortLinkFor(stream("ended"), "nogood")).toBeUndefined()
  expect(shortLinkFor(stream("ended", N94_LIVE_STREAM), "nogood")).toBe("/nogood")
  expect(shortLinkFor(stream("live"), undefined)).toBeUndefined()
})
