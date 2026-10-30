import { describe, expect, it } from "bun:test"
import { shouldReleasePlayer } from "./release-player"

describe("shouldReleasePlayer", () => {
  it("keeps a player that is still on the page", () => {
    expect(shouldReleasePlayer({ api: {}, isConnected: true })).toBe(false)
  })

  it("releases a player removed from the page", () => {
    expect(shouldReleasePlayer({ api: {}, isConnected: false })).toBe(true)
  })

  it("skips a player that never loaded", () => {
    expect(shouldReleasePlayer({ api: null, isConnected: false })).toBe(false)
    expect(shouldReleasePlayer(null)).toBe(false)
  })
})
