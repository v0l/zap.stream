import "@/test/dom"
import { afterEach, expect, test } from "bun:test"
import { getSigner, LoginStore, LoginType } from "./login"
import { RemoteSigner } from "./remote-signer"
import { Nip46Fixture } from "./test/nip46-fixture"
import { getPublicKey, generateSecretKey, finalizeEvent } from "nostr-tools/pure"
import { encrypt, getConversationKey } from "nostr-tools/nip44"
import { EventKind, type SystemInterface, UserStateChangeType } from "@snort/system"

afterEach(() => window.localStorage.clear())

test("retry after cancelled initial sync restores the encrypted mute list with the replacement signer", async () => {
  using fixture = new Nip46Fixture()
  const signer = await RemoteSigner.connect(fixture.bunkerUri)
  const store = new LoginStore()
  const hidden = getPublicKey(generateSecretKey())
  const event = finalizeEvent(
    {
      kind: EventKind.MuteList,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: encrypt(JSON.stringify([["p", hidden]]), getConversationKey(fixture.identity, fixture.pubkey)),
    },
    fixture.identity,
  )
  const fetchEvents = async () => [event]
  const rejectBroadcast = async () => {
    throw new Error("This test must not publish")
  }
  const system = { Fetch: fetchEvents, BroadcastEvent: rejectBroadcast } as unknown as SystemInterface
  try {
    store.loginWithRemoteSigner(signer)
    const previous = store.takeSnapshot()?.state
    if (!previous) throw new Error("Missing state")
    fixture.approvalUrl = "https://signer.example/approve"
    const approval = new Promise<void>(resolve => {
      fixture.onApproval = resolve
    })
    const initialising = previous.init(signer, system)
    await approval
    signer.close()
    await initialising
    expect(previous.muted).toEqual([])
    fixture.approvalUrl = undefined
    const session = store.takeSnapshot()
    if (!session) throw new Error("Missing session")
    const retry = getSigner(session)
    if (!retry) throw new Error("Missing retry signer")
    const current = store.takeSnapshot()?.state
    if (!current) throw new Error("Missing retry state")
    await current.init(retry, system)
    expect(current.muted.map(link => link.toEventTag()?.[1])).toContain(hidden)
    expect(current.signer).toBe(retry)
    expect(current).not.toBe(previous)
    const saved = window.localStorage.getItem("session")
    previous.emit("change", UserStateChangeType.GenericList)
    expect(window.localStorage.getItem("session")).toBe(saved)
  } finally {
    store.logout()
    signer.close()
  }
})

test.each(["preference", "state", "signer", "logout"])(
  "a stale %s action cannot revive credentials before a queued cross-tab logout is delivered",
  async action => {
    using fixture = new Nip46Fixture()
    const signer = await RemoteSigner.connect(fixture.bunkerUri)
    const store = new LoginStore()
    try {
      store.loginWithRemoteSigner(signer)
      const session = store.takeSnapshot()
      if (!session) throw new Error("Missing session")
      const before = window.localStorage.getItem("session")
      window.localStorage.removeItem("session")
      if (action === "preference") store.setColor("red")
      if (action === "state") session.state?.emit("change", UserStateChangeType.GenericList)
      if (action === "signer") expect(getSigner(session)).toBeUndefined()
      if (action === "logout") store.logout()
      expect(store.takeSnapshot()).toBeUndefined()
      expect(signer.closed).toBe(true)
      window.dispatchEvent(
        new StorageEvent("storage", { key: "session", storageArea: window.localStorage, oldValue: before, newValue: null }),
      )
      expect(window.localStorage.getItem("session")).toBeNull()
      expect(store.takeSnapshot()).toBeUndefined()
      expect(signer.closed).toBe(true)
      expect(getSigner(session)).toBeUndefined()
    } finally {
      store.logout()
      signer.close()
    }
  },
)

test("a stale state save or logout preserves an account replacement before its storage event arrives", async () => {
  using fixture = new Nip46Fixture()
  const signer = await RemoteSigner.connect(fixture.bunkerUri)
  const store = new LoginStore()
  try {
    store.loginWithRemoteSigner(signer)
    const replacement = JSON.stringify({ type: LoginType.Nip7, pubkey: getPublicKey(generateSecretKey()) })
    window.localStorage.setItem("session", replacement)
    store.update(session => {
      session.color = "red"
    })
    store.logout()
    expect(window.localStorage.getItem("session")).toBe(replacement)
    expect(store.takeSnapshot()).toBeUndefined()
    expect(signer.closed).toBe(true)
  } finally {
    store.logout()
    signer.close()
  }
})

test("a queued logout revokes a matching credential even if another stale tab rewrote storage", async () => {
  using fixture = new Nip46Fixture()
  const signer = await RemoteSigner.connect(fixture.bunkerUri)
  const store = new LoginStore()
  try {
    store.loginWithRemoteSigner(signer)
    const before = window.localStorage.getItem("session")
    window.localStorage.removeItem("session")
    // Simulate an already queued save from a different tab before delivery.
    window.localStorage.setItem("session", before ?? "")
    window.dispatchEvent(
      new StorageEvent("storage", { key: "session", storageArea: window.localStorage, oldValue: before, newValue: null }),
    )
    expect(store.takeSnapshot()).toBeUndefined()
    expect(signer.closed).toBe(true)
    expect(window.localStorage.getItem("session")).toBeNull()
  } finally {
    store.logout()
    signer.close()
  }
})

test("an older queued logout cannot revoke a newly approved connection", async () => {
  using fixture = new Nip46Fixture()
  const first = await RemoteSigner.connect(fixture.bunkerUri)
  const second = await RemoteSigner.connect(fixture.bunkerUri)
  const store = new LoginStore()
  try {
    store.loginWithRemoteSigner(first)
    const before = window.localStorage.getItem("session")
    store.loginWithRemoteSigner(second)
    window.dispatchEvent(
      new StorageEvent("storage", { key: "session", storageArea: window.localStorage, oldValue: before, newValue: null }),
    )
    expect(store.takeSnapshot()?.remote).toBe(second.connection)
    expect(second.closed).toBe(false)
  } finally {
    store.logout()
    first.close()
    second.close()
  }
})

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
