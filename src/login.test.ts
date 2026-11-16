import "@/test/dom"
import { afterEach, expect, test } from "bun:test"
import { getSigner, LoginStore, LoginType } from "./login"
import { RemoteSigner } from "./remote-signer"
import { Nip46Fixture } from "./test/nip46-fixture"
import { getPublicKey, generateSecretKey } from "nostr-tools/pure"

afterEach(() => window.localStorage.clear())

test("keeps Bark/NIP-07 sessions on the extension path", () => {
  const store = new LoginStore()
  const pubkey = getPublicKey(generateSecretKey())
  store.loginWithPubkey(pubkey)
  expect(store.takeSnapshot()?.type).toBe(LoginType.Nip7)
  expect(JSON.parse(window.localStorage.getItem("session") ?? "{}").remote).toBeUndefined()
  const restored = new LoginStore()
  expect(restored.takeSnapshot()?.pubkey).toBe(pubkey)
  store.logout()
  restored.logout()
})

test("persists remote credentials, reuses the signer and closes it on logout", async () => {
  using fixture = new Nip46Fixture()
  const signer = await RemoteSigner.connect(fixture.bunkerUri)
  const store = new LoginStore()
  try {
    store.loginWithRemoteSigner(signer)
    const session = store.takeSnapshot()
    if (!session) throw new Error("Login missing")
    expect(getSigner(session)).toBe(signer)
    const stored = JSON.parse(window.localStorage.getItem("session") ?? "{}")
    expect(stored.pubkey).toBe(fixture.pubkey)
    expect(stored.remote.bunker.secret).toBeNull()
    expect(stored.privateKey).toBeUndefined()
    store.logout()
    expect(signer.closed).toBe(true)
    expect(window.localStorage.getItem("session")).toBeNull()
  } finally {
    store.logout()
    signer.close()
  }
})

test("discards an invalid or mismatched remote session without affecting legacy sessions", () => {
  window.localStorage.setItem("session", JSON.stringify({ type: LoginType.Nip46, pubkey: "bad", remote: {} }))
  expect(new LoginStore().takeSnapshot()).toBeUndefined()
  expect(window.localStorage.getItem("session")).toBeNull()
  const pubkey = getPublicKey(generateSecretKey())
  window.localStorage.setItem("session", JSON.stringify({ pubkey }))
  const store = new LoginStore()
  expect(store.takeSnapshot()?.type).toBe(LoginType.Nip7)
  store.logout()
})

test("a storage failure keeps the previous session instead of adopting a remote connection", async () => {
  using fixture = new Nip46Fixture()
  const signer = await RemoteSigner.connect(fixture.bunkerUri)
  const store = new LoginStore()
  const pubkey = getPublicKey(generateSecretKey())
  store.loginWithPubkey(pubkey)
  const storage = window.localStorage
  const descriptor = Object.getOwnPropertyDescriptor(window, "localStorage")
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      setItem() {
        throw new Error("Storage full")
      },
    },
  })
  try {
    expect(() => store.loginWithRemoteSigner(signer)).toThrow("Storage full")
    expect(store.takeSnapshot()?.type).toBe(LoginType.Nip7)
    expect(store.takeSnapshot()?.pubkey).toBe(pubkey)
    expect(JSON.parse(storage.getItem("session") ?? "{}").pubkey).toBe(pubkey)
  } finally {
    if (descriptor) Object.defineProperty(window, "localStorage", descriptor)
    else Object.defineProperty(window, "localStorage", { configurable: true, value: storage })
    store.logout()
    signer.close()
  }
})

test("retained session callbacks cannot reopen a signer after logout or account switching", async () => {
  using fixture = new Nip46Fixture()
  const signer = await RemoteSigner.connect(fixture.bunkerUri)
  const store = new LoginStore()
  try {
    store.loginWithRemoteSigner(signer)
    const stale = store.takeSnapshot()
    if (!stale) throw new Error("Missing session")
    store.logout()
    expect(signer.closed).toBe(true)
    expect(getSigner(stale)).toBeUndefined()
    const second = await RemoteSigner.connect(fixture.bunkerUri)
    store.loginWithRemoteSigner(second)
    const switched = store.takeSnapshot()
    if (!switched) throw new Error("Missing second session")
    store.loginWithPubkey(getPublicKey(generateSecretKey()))
    expect(second.closed).toBe(true)
    expect(getSigner(switched)).toBeUndefined()
  } finally {
    store.logout()
    signer.close()
  }
})

test("logout or account replacement in another tab closes the signer without erasing the replacement", async () => {
  using fixture = new Nip46Fixture()
  const signer = await RemoteSigner.connect(fixture.bunkerUri)
  const store = new LoginStore()
  try {
    store.loginWithRemoteSigner(signer)
    const session = store.takeSnapshot()
    if (!session) throw new Error("Missing session")
    // A profile change in another tab keeps this connection authorised.
    window.dispatchEvent(new StorageEvent("storage", { key: "session", storageArea: window.localStorage }))
    expect(signer.closed).toBe(false)
    const replacement = JSON.stringify({ type: LoginType.Nip7, pubkey: getPublicKey(generateSecretKey()) })
    window.localStorage.setItem("session", replacement)
    window.dispatchEvent(new StorageEvent("storage", { key: "session", storageArea: window.localStorage }))
    expect(signer.closed).toBe(true)
    expect(store.takeSnapshot()).toBeUndefined()
    expect(getSigner(session)).toBeUndefined()
    expect(window.localStorage.getItem("session")).toBe(replacement)

    const next = await RemoteSigner.connect(fixture.bunkerUri)
    store.loginWithRemoteSigner(next)
    window.localStorage.clear()
    window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: window.localStorage }))
    expect(next.closed).toBe(true)
    expect(store.takeSnapshot()).toBeUndefined()
  } finally {
    store.logout()
    signer.close()
  }
})
