import "@/test/dom"
import { afterEach, expect, test } from "bun:test"
import { NostrPrefix } from "@snort/shared"
import { getSigner, LoginStore, LoginType } from "./login"
import { RemoteSigner } from "./remote-signer"
import { Nip46Fixture } from "./test/nip46-fixture"
import { getPublicKey, generateSecretKey, finalizeEvent, verifyEvent } from "nostr-tools/pure"
import { decrypt, encrypt, getConversationKey } from "nostr-tools/nip44"
import { EventKind, type SystemInterface, UserStateChangeType, NostrLink } from "@snort/system"

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
    expect(await current.signer?.getPubKey()).toBe(fixture.pubkey)
    expect(current).not.toBe(previous)
    await expect(Promise.resolve().then(() => previous.signer?.getPubKey())).rejects.toThrow("closed")
    const saved = window.localStorage.getItem("session")
    previous.emit("change", UserStateChangeType.GenericList)
    expect(window.localStorage.getItem("session")).toBe(saved)
  } finally {
    store.logout()
    signer.close()
  }
})

test("refused initial decryption retries without requiring a closed transport", async () => {
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
  let refuse = true
  const handle = fixture.handle.bind(fixture)
  fixture.handle = request => {
    if (refuse && request.method === "nip44_decrypt") throw new Error("User refused decrypt")
    return handle(request)
  }
  const fetchEvents = async () => [event]
  const system = { Fetch: fetchEvents } as unknown as SystemInterface
  try {
    store.loginWithRemoteSigner(signer)
    const state = store.takeSnapshot()?.state
    if (!state) throw new Error("Missing state")
    await state.init(signer, system)
    expect(signer.closed).toBe(false)
    expect(state.muted).toEqual([])
    refuse = false
    const session = store.takeSnapshot()
    if (!session) throw new Error("Missing session")
    expect(getSigner(session)).toBe(signer)
    const next = store.takeSnapshot()?.state
    if (!next) throw new Error("Missing retry state")
    expect(next).not.toBe(state)
    await next.init(signer, system)
    expect(next.muted.map(link => link.toEventTag()?.[1])).toContain(hidden)
  } finally {
    store.logout()
    signer.close()
  }
})

test("retry after a later cancellation preserves decrypted mutes and pending list changes with an empty relay", async () => {
  using fixture = new Nip46Fixture()
  const signer = await RemoteSigner.connect(fixture.bunkerUri)
  const store = new LoginStore()
  const hidden = getPublicKey(generateSecretKey())
  const added = getPublicKey(generateSecretKey())
  const event = finalizeEvent(
    {
      kind: EventKind.MuteList,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: encrypt(JSON.stringify([["p", hidden]]), getConversationKey(fixture.identity, fixture.pubkey)),
    },
    fixture.identity,
  )
  let offline = false
  const published: (typeof event)[] = []
  const fetchEvents = async () => (offline ? [] : [event])
  const broadcast = async (signed: typeof event) => {
    published.push(signed)
  }
  const system = { Fetch: fetchEvents, BroadcastEvent: broadcast } as unknown as SystemInterface
  try {
    store.loginWithRemoteSigner(signer)
    const session = store.takeSnapshot()
    const state = session?.state
    if (!state || !session) throw new Error("Missing state")
    await state.init(signer, system)
    expect(state.muted.map(link => link.toEventTag()?.[1])).toContain(hidden)
    state.mute(new NostrLink(NostrPrefix.PublicKey, added))
    signer.close()
    offline = true
    const retry = getSigner(session)
    const next = store.takeSnapshot()?.state
    if (!retry || !next) throw new Error("Missing retry")
    await next.init(retry, system)
    expect(next).toBe(state)
    expect(next.muted.map(link => link.toEventTag()?.[1])).toEqual([hidden])
    await next.saveList(EventKind.MuteList)
    expect(published).toHaveLength(1)
    expect(verifyEvent(published[0])).toBe(true)
    expect(published[0].pubkey).toBe(fixture.pubkey)
    expect(JSON.parse(decrypt(published[0].content, getConversationKey(fixture.identity, fixture.pubkey)))).toEqual([
      ["p", hidden],
      ["p", added],
    ])
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
        new StorageEvent("storage", {
          key: "session",
          storageArea: window.localStorage,
          oldValue: before,
          newValue: null,
        }),
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
    window.localStorage.setItem("session", before ?? "")
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "session",
        storageArea: window.localStorage,
        oldValue: before,
        newValue: null,
      }),
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
      new StorageEvent("storage", {
        key: "session",
        storageArea: window.localStorage,
        oldValue: before,
        newValue: null,
      }),
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
