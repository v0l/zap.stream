import { describe, expect, it } from "bun:test"
import { isNostrAddressPath } from "./route"

describe("isNostrAddressPath", () => {
  it("accepts a single name segment", () => {
    expect(isNostrAddressPath("/kieran")).toBe(true)
  })
  it("rejects app routes", () => {
    for (const p of ["/streams", "/videos", "/app", "/settings", "/shorts", "/login"]) {
      expect(isNostrAddressPath(p)).toBe(false)
    }
  })
  it("rejects nested paths and root", () => {
    expect(isNostrAddressPath("/a/b")).toBe(false)
    expect(isNostrAddressPath("/")).toBe(false)
  })
})
