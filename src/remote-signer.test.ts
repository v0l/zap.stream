import { expect, test } from "bun:test"
import { isRemoteConnection, parseBunkerConnection, RemoteSigner, validateSigningResult } from "./remote-signer"
import { finalizeEvent, generateSecretKey, getPublicKey } from "nostr-tools/pure"
import { Nip46Fixture } from "./test/nip46-fixture"
import { decrypt, encrypt, getConversationKey } from "nostr-tools/nip44"

const key = generateSecretKey()
const pubkey = getPublicKey(key)

test("accepts Signet bunker links without a secret and keeps all relay choices", () => {
  const p = parseBunkerConnection(`bunker://${pubkey}?relay=wss%3A%2F%2Frelay.example&relay=wss%3A%2F%2Fbackup.example`)
  expect(p).toEqual({ pubkey, secret: null, relays: ["wss://relay.example/", "wss://backup.example/"] })
})

test("rejects malformed bunker links and insecure remote relays", () => {
  for (const input of [
    "https://example.com",
    `bunker://${pubkey}`,
    `bunker://${pubkey}?relay=ws://example.com`,
    `bunker://${pubkey}?relay=wss://user:password@example.com`,
    `bunker://bad?relay=wss://example.com`,
  ]) {
    expect(() => parseBunkerConnection(input)).toThrow()
  }
  expect(parseBunkerConnection(`bunker://${pubkey}?relay=ws://127.0.0.1:7777`).relays).toEqual(["ws://127.0.0.1:7777/"])
})

test("rejects valid signatures for another identity or changed event content", () => {
  const template = { kind: 1311, created_at: 1_800_000_000, content: "hello", tags: [["a", "30311:stream"]] }
  const signed = finalizeEvent({ ...template }, key)
  expect(validateSigningResult(signed, template, pubkey)).toEqual(signed)
  expect(() => validateSigningResult(finalizeEvent({ ...template }, generateSecretKey()), template, pubkey)).toThrow()
  expect(() =>
    validateSigningResult(finalizeEvent({ ...template, content: "changed" }, key), template, pubkey),
  ).toThrow()
  expect(() => validateSigningResult({ ...signed, sig: "0".repeat(128) }, template, pubkey)).toThrow()
})

test("bunker login signs chat and HTTP auth with the signing identity, not the transport identity", async () => {
  using fixture = new Nip46Fixture()
  const signer = await RemoteSigner.connect(fixture.bunkerUri)
  try {
    expect(await signer.getPubKey()).toBe(fixture.pubkey)
    expect(signer.connection.pubkey).not.toBe(signer.connection.bunker.pubkey)
    for (const kind of [1311, 27235]) {
      const event = { kind, created_at: Math.floor(Date.now() / 1000), tags: [["test", "local"]], content: "hello" }
      const signed = await signer.sign(event)
      expect(validateSigningResult(signed, event, fixture.pubkey)).toBe(signed)
    }
    const peer = generateSecretKey()
    const peerPubkey = getPublicKey(peer)
    const conversation = getConversationKey(peer, fixture.pubkey)
    expect(decrypt(await signer.nip44Encrypt("outgoing", peerPubkey), conversation)).toBe("outgoing")
    expect(await signer.nip44Decrypt(encrypt("incoming", conversation), peerPubkey)).toBe("incoming")
  } finally {
    signer.close()
  }
})

test("restores the same authorised client without reusing a one-time bunker secret", async () => {
  using fixture = new Nip46Fixture({ secret: "one-time-secret" })
  const signer = await RemoteSigner.connect(fixture.bunkerUri)
  const saved = JSON.parse(JSON.stringify(signer.connection))
  signer.close()
  expect(saved.bunker.secret).toBeNull()
  expect(isRemoteConnection(saved)).toBe(true)
  const restored = RemoteSigner.restore(saved)
  try {
    expect(await restored.getPubKey()).toBe(fixture.pubkey)
    expect(fixture.requests.filter(r => r.method === "connect")).toHaveLength(1)
    expect(new Set(fixture.requests.map(r => r.client)).size).toBe(1)
  } finally {
    restored.close()
  }
})

test("QR pairing ignores the wrong secret and wrong recipient before accepting the real signer", async () => {
  using fixture = new Nip46Fixture()
  const pairing = RemoteSigner.pair(fixture.relayUrl, "https://client.example")
  try {
    await fixture.waitForSubscription(new URL(pairing.uri).hostname)
    fixture.acceptPairing(pairing.uri, { secret: "wrong-secret", authorise: false })
    fixture.acceptPairing(pairing.uri, { recipient: getPublicKey(generateSecretKey()), authorise: false })
    fixture.acceptPairing(pairing.uri)
    const signer = await pairing.connected
    try {
      expect(signer.connection.bunker.pubkey).toBe(fixture.transportPubkey)
      expect(await signer.getPubKey()).toBe(fixture.pubkey)
    } finally {
      signer.close()
    }
  } finally {
    pairing.close()
  }
})

test("rejects a changed identity when a saved connection is restored", async () => {
  using fixture = new Nip46Fixture()
  const signer = await RemoteSigner.connect(fixture.bunkerUri)
  const saved = signer.connection
  signer.close()
  fixture.identity = generateSecretKey()
  const restored = RemoteSigner.restore(saved)
  await expect(restored.getPubKey()).rejects.toThrow("identity changed")
  expect(restored.closed).toBe(true)
})

test("rejects revoked access, changed signed events and a rejected connection", async () => {
  using fixture = new Nip46Fixture({ secret: "expected" })
  await expect(RemoteSigner.connect(fixture.bunkerUri.replace("expected", "wrong"))).rejects.toThrow(
    "Connection rejected",
  )
  const signer = await RemoteSigner.connect(fixture.bunkerUri)
  try {
    const template = { kind: 1311, created_at: 1_800_000_000, tags: [], content: "original" }
    fixture.changeEvent = true
    await expect(signer.sign(template)).rejects.toThrow("different identity or event")
    fixture.changeEvent = false
    fixture.authorised.clear()
    await expect(signer.sign(template)).rejects.toThrow("Not authorised")
  } finally {
    signer.close()
  }
})

test("times out offline connections and cancels pending signing and QR pairing", async () => {
  using fixture = new Nip46Fixture()
  fixture.silent = true
  await expect(RemoteSigner.connect(fixture.bunkerUri, { timeoutMs: 100 })).rejects.toThrow("timed out")
  fixture.silent = false
  const signer = await RemoteSigner.connect(fixture.bunkerUri)
  await signer.init()
  fixture.silent = true
  const pending = signer.sign({ kind: 1311, created_at: 1_800_000_000, tags: [], content: "pending" })
  signer.close()
  await expect(pending).rejects.toThrow("closed")
  const abort = new AbortController()
  const pairing = RemoteSigner.pair(fixture.relayUrl, "https://client.example", { signal: abort.signal })
  abort.abort()
  await expect(pairing.connected).rejects.toThrow()
})
