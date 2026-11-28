import { describe, expect, it } from "bun:test"
import { safeExternalHref } from "./external-link"

describe("safeExternalHref", () => {
  it("allows standard web, nostr, and lightning schemes", () => {
    const allowed = [
      "https://zap.stream/live/test",
      "http://example.com/path?a=1#b",
      "HTTPS://EXAMPLE.COM/UPPER",
      "  https://zap.stream/trimmed  ",
      "mailto:hello@example.com",
      "nostr:npub1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsutm29e",
      "web+nostr:naddr1qqqqqq",
      "lightning:lnbc10u1p0test",
      "magnet:?xt=urn:btih:0123456789abcdef",
      "blossom:0123456789abcdef",
    ]
    for (const url of allowed) {
      expect(safeExternalHref(url)).toBe(url.trim())
    }
  })

  it("blocks executable and non-allowlisted schemes", () => {
    const blocked = [
      "javascript:alert(1)",
      "JAVASCRIPT:alert(1)",
      "  javascript:alert(1)",
      "java\tscript:alert(1)",
      "java\nscript:alert(1)",
      "java\rscript:alert(1)",
      "\u0000javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "data:image/svg+xml,<svg onload=alert(1)>",
      "vbscript:msgbox(1)",
      "blob:https://zap.stream/550e8400-e29b-41d4-a716-446655440000",
      "file:///etc/passwd",
      "ftp://example.com/file.zip",
    ]
    for (const url of blocked) {
      expect(safeExternalHref(url)).toBeUndefined()
    }
  })

  it("blocks protocol-relative, relative, empty, and malformed inputs", () => {
    const blocked = ["", "   ", undefined, null, "//evil.example/phish", "/\\evil.example/phish", "/settings", "#anchor", "not a url", "https://example.com/bad\nheader"]
    for (const url of blocked) {
      expect(safeExternalHref(url)).toBeUndefined()
    }
  })
})
