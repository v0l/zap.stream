import { describe, expect, test } from "bun:test"
import { base64, hex } from "@scure/base"
import { NostrStreamProvider, HTTP_AUTH_KIND } from "./index"
import type { NostrEvent, Signer } from "./types"

// Minimal signer: computes the NIP-01 event id so the auth event is well-formed.
function testSigner(): Signer {
  return {
    getPubKey: () => "2f6b3a2d9ac507a2a3e3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3aa01",
    sign: async (event: NostrEvent) => {
      const serialized = JSON.stringify([
        0,
        event.pubkey,
        event.created_at,
        event.kind,
        event.tags,
        event.content,
      ])
      const hash = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(serialized))
      return { ...event, id: base64.encode(new Uint8Array(hash)), sig: "00".repeat(64) }
    },
  }
}

async function sha256Hex(input: string): Promise<Uint8Array> {
  return new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)))
}

describe("NIP-98 auth event", () => {
  test("binds the request body via a payload tag", async () => {
    let capturedAuth: NostrEvent | undefined
    let capturedBody: string | undefined
    const origFetch = globalThis.fetch
    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = init?.body as string
      const authHeader = (init?.headers as Record<string, string> | undefined)?.authorization as string
      capturedAuth = JSON.parse(new TextDecoder().decode(base64.decode(authHeader.slice("Nostr ".length))))
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }) as typeof fetch

    try {
      const provider = new NostrStreamProvider("test", "https://api.example.test/api/v1", testSigner())
      await provider.acceptTos()
    } finally {
      globalThis.fetch = origFetch
    }

    expect(capturedAuth?.kind).toBe(HTTP_AUTH_KIND)
    expect(capturedBody).toBe(JSON.stringify({ accept_tos: true }))
    const payloadTag = capturedAuth?.tags.find(t => t[0] === "payload")
    expect(payloadTag).toBeDefined()
    const expected = hex.encode(await sha256Hex(capturedBody as string))
    expect(payloadTag?.[1]).toBe(expected)
    expect(capturedAuth?.tags.find(t => t[0] === "u")?.[1]).toBe("https://api.example.test/api/v1/account")
    expect(capturedAuth?.tags.find(t => t[0] === "method")?.[1]).toBe("PATCH")
  })

  test("omits the payload tag for bodyless requests", async () => {
    let capturedAuth: NostrEvent | undefined
    const origFetch = globalThis.fetch
    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      const authHeader = (init?.headers as Record<string, string> | undefined)?.authorization as string
      capturedAuth = JSON.parse(new TextDecoder().decode(base64.decode(authHeader.slice("Nostr ".length))))
      return new Response(JSON.stringify({ balance: 0 }), { status: 200 })
    }) as typeof fetch

    try {
      const provider = new NostrStreamProvider("test", "https://api.example.test/api/v1", testSigner())
      await provider.info()
    } finally {
      globalThis.fetch = origFetch
    }

    expect(capturedAuth?.tags.find(t => t[0] === "payload")).toBeUndefined()
  })
})
