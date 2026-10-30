import { describe, expect, it } from "bun:test"
import { isClientAt } from "./sw-url"

describe("isClientAt", () => {
  it("matches an absolute client url to a relative path", () => {
    expect(isClientAt("https://zap.stream/npub1abc", "/npub1abc", "https://zap.stream")).toBe(true)
  })
  it("ignores other paths and origins", () => {
    expect(isClientAt("https://zap.stream/other", "/npub1abc", "https://zap.stream")).toBe(false)
    expect(isClientAt("https://evil.com/npub1abc", "/npub1abc", "https://zap.stream")).toBe(false)
  })
})
