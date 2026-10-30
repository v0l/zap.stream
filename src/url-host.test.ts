import { describe, expect, it } from "bun:test"
import { isLocalUrl } from "./url-host"

describe("isLocalUrl", () => {
  it("detects local hostnames", () => {
    expect(isLocalUrl("http://localhost:8080/a.m3u8")).toBe(true)
    expect(isLocalUrl("http://127.0.0.1/a.m3u8")).toBe(true)
  })
  it("ignores the word in path or other hosts", () => {
    expect(isLocalUrl("https://x.com/localhost/a.m3u8")).toBe(false)
    expect(isLocalUrl("https://localhost.example.com/a.m3u8")).toBe(false)
  })
})
