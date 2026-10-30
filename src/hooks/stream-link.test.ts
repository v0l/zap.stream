import { describe, expect, it } from "bun:test"
import { NostrLink } from "@snort/system"
import type { NostrEvent } from "@snort/system"
import { nip05Address, resolveStreamLink } from "./stream-link"

const host = "a".repeat(64)
function stream(d: string): NostrEvent {
  return { id: d.padEnd(64, "0"), pubkey: host, kind: 30311, created_at: 1, tags: [["d", d]], content: "", sig: "" }
}

describe("resolveStreamLink", () => {
  it("follows the preloaded stream when it changes", () => {
    const first = resolveStreamLink(stream("one"), undefined)
    const second = resolveStreamLink(stream("two"), undefined)
    expect(first?.id).toBe("one")
    expect(second?.id).toBe("two")
  })

  it("parses the url id when there is no preload", () => {
    const naddr = NostrLink.fromEvent(stream("three")).encode()
    expect(resolveStreamLink(undefined, naddr)?.id).toBe("three")
  })

  it("prefers the preload over the url id", () => {
    const naddr = NostrLink.fromEvent(stream("three")).encode()
    expect(resolveStreamLink(stream("four"), naddr)?.id).toBe("four")
  })
})

describe("dashboard name links", () => {
  it("treats a bare name as a nip05 handle instead of throwing", () => {
    expect(() => resolveStreamLink(undefined, "nogood")).not.toThrow()
    expect(resolveStreamLink(undefined, "nogood")).toBeUndefined()
    expect(nip05Address("nogood")).toEqual({ handle: "nogood", domain: "zap.stream" })
    expect(nip05Address("bob@example.com")).toEqual({ handle: "bob", domain: "example.com" })
  })
})
