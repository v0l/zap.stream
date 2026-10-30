import { describe, expect, it } from "bun:test"
import { NostrPrefix } from "@snort/shared"
import { NostrLink } from "@snort/system"
import { sumZapsByStream } from "./stream-zaps"

const host = "a".repeat(64)
const streamA = new NostrLink(NostrPrefix.Address, "stream-a", 30311, host)
const streamB = new NostrLink(NostrPrefix.Address, "stream-b", 30311, host)
const unrelated = new NostrLink(NostrPrefix.Address, "other", 30311, host)

describe("sumZapsByStream", () => {
  it("adds zap amounts per stream", () => {
    const totals = sumZapsByStream(
      [
        { amount: 1000, created_at: 200, targetEvents: [streamA] },
        { amount: 21, created_at: 210, targetEvents: [streamA] },
        { amount: 500, created_at: 220, targetEvents: [streamB] },
      ],
      [streamA, streamB],
      100,
    )
    expect(totals).toEqual({ [streamA.tagKey]: 1021, [streamB.tagKey]: 500 })
  })

  it("ignores zaps older than the window", () => {
    const totals = sumZapsByStream([{ amount: 1000, created_at: 50, targetEvents: [streamA] }], [streamA], 100)
    expect(totals).toEqual({})
  })

  it("ignores zaps for streams not on the page", () => {
    const totals = sumZapsByStream([{ amount: 1000, created_at: 200, targetEvents: [unrelated] }], [streamA], 100)
    expect(totals).toEqual({})
  })

  it("counts a zap once when it targets the same stream twice", () => {
    const sameStream = new NostrLink(NostrPrefix.Address, "stream-a", 30311, host)
    const totals = sumZapsByStream(
      [{ amount: 1000, created_at: 200, targetEvents: [streamA, sameStream] }],
      [streamA],
      100,
    )
    expect(totals).toEqual({ [streamA.tagKey]: 1000 })
  })
})
