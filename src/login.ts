import { ExternalStore, unwrap } from "@snort/shared"
import { EventKind, EventPublisher, Nip7Signer, PrivateKeySigner, UserState, type UserStateObject } from "@snort/system"
import { isRemoteConnection, RemoteSigner, type RemoteConnection } from "./remote-signer"

export enum LoginType {
  Nip7 = "nip7",
  PrivateKey = "private-key",
  Nip46 = "nip46",
}

export interface LoginSession {
  type: LoginType
  pubkey: string
  privateKey?: string
  remote?: RemoteConnection
  state?: UserState<never>
  color?: string
  wallet?: {
    type: number
    data: string
  }
}

const SESSION_KEY = "session"
const remoteSigners = new WeakMap<RemoteConnection, () => RemoteSigner | undefined>()
const disposedConnections = new WeakSet<RemoteConnection>()

function matchesRemoteSession(json: string | null, connection: RemoteConnection) {
  try {
    const saved: LoginSession | null = JSON.parse(json ?? "null")
    return (
      saved?.type === LoginType.Nip46 &&
      isRemoteConnection(saved.remote) &&
      saved.pubkey === connection.pubkey &&
      saved.remote.pubkey === connection.pubkey &&
      saved.remote.clientSecret === connection.clientSecret &&
      saved.remote.bunker.pubkey === connection.bunker.pubkey
    )
  } catch {
    return false
  }
}

export class LoginStore extends ExternalStore<LoginSession | undefined> {
  #session?: LoginSession
  #storageListener?: (event: StorageEvent) => void
  #remoteSigner?: RemoteSigner

  constructor() {
    super()
    const json = window.localStorage.getItem(SESSION_KEY)
    if (json) {
      try {
        this.#session = JSON.parse(json)
        if (
          this.#session?.type === LoginType.Nip46 &&
          (!isRemoteConnection(this.#session.remote) || this.#session.remote.pubkey !== this.#session.pubkey)
        ) {
          this.#session = undefined
          window.localStorage.removeItem(SESSION_KEY)
        }
      } catch {
        window.localStorage.removeItem(SESSION_KEY)
      }
      if (this.#session) {
        let save = false
        this.#session.state = this.#makeState()
        //reset
        this.#session.type ??= LoginType.Nip7
        if ("cards" in this.#session) {
          delete this.#session.cards
          save = true
        }
        if ("emojis" in this.#session) {
          delete this.#session.emojis
          save = true
        }
        if ("follows" in this.#session) {
          delete this.#session.follows
          save = true
        }
        if ("muted" in this.#session) {
          delete this.#session.muted
          save = true
        }

        if (save) {
          this.#save()
        }
        this.#watchRemoteSession()
      }
    }
  }

  #makeState(session = this.#session, initial = session?.state as UserStateObject<never> | undefined) {
    if (session) {
      const ret = new UserState(session.pubkey, undefined, initial)
      ret.checkIsStandardList(EventKind.StorageServerList)
      ret.checkIsStandardList(EventKind.MuteList)
      ret.on("change", () => {
        if (this.#session?.state === ret) this.#save()
      })
      return ret
    }
  }

  loginWithPubkey(pk: string, type = LoginType.Nip7) {
    this.#disposeSession()
    this.#session = {
      type,
      pubkey: pk,
    }
    this.#session.state = this.#makeState()
    this.#save()
  }

  loginWithPrivateKey(key: string) {
    const signer = new PrivateKeySigner(key)
    this.#disposeSession()
    this.#session = {
      type: LoginType.PrivateKey,
      pubkey: signer.getPubKey(),
      privateKey: signer.privateKey,
    }
    this.#session.state = this.#makeState()
    this.#save()
  }

  loginWithRemoteSigner(signer: RemoteSigner) {
    if (signer.closed || disposedConnections.has(signer.connection))
      throw new Error("Remote signer connection was closed")
    const next: LoginSession = { type: LoginType.Nip46, pubkey: signer.connection.pubkey, remote: signer.connection }
    next.state = this.#makeState(next)
    // Save before adopting it: failed storage must not leave an invisible login.
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...next, state: next.state?.serialize() }))
    } catch (error) {
      next.state?.off("change")
      next.state?.destroy()
      throw error
    }
    this.#disposeSession()
    this.#session = next
    this.#remoteSigner = signer
    this.#watchRemoteSession()
    this.notifyChange()
  }

  #revokeRemoteSession() {
    this.#disposeSession()
    this.#session = undefined
    // Another tab may own the saved replacement. Do not overwrite it.
    this.notifyChange()
  }

  #ownsRemoteSession(connection: RemoteConnection) {
    if (this.#session?.remote !== connection) return false
    if (matchesRemoteSession(window.localStorage.getItem(SESSION_KEY), connection)) return true
    this.#revokeRemoteSession()
    return false
  }

  #getRemoteSigner(connection: RemoteConnection) {
    if (!this.#ownsRemoteSession(connection)) return
    if (!this.#remoteSigner) {
      this.#remoteSigner = RemoteSigner.restore(connection)
    } else if (this.#remoteSigner.closed) {
      // UserState.init is memoised. A cancelled decrypt must be synced again
      // with the replacement transport, including encrypted mute lists.
      const previous = this.#session?.state
      const initial = previous?.serialize()
      previous?.off("change")
      previous?.destroy()
      this.#remoteSigner = RemoteSigner.restore(connection)
      if (this.#session) this.#session.state = this.#makeState(this.#session, initial)
      this.notifyChange()
    }
    return this.#remoteSigner
  }

  #watchRemoteSession() {
    const connection = this.#session?.remote
    if (!connection) return
    remoteSigners.set(connection, () => this.#getRemoteSigner(connection))
    this.#storageListener = event => {
      if (event.storageArea !== window.localStorage || (event.key !== SESSION_KEY && event.key !== null)) return
      // Storage events are queued: rereading storage alone can miss a logout
      // if a stale tab saved the old credential before the event arrived.
      if (matchesRemoteSession(event.oldValue, connection) && !matchesRemoteSession(event.newValue, connection)) {
        if (matchesRemoteSession(window.localStorage.getItem(SESSION_KEY), connection)) {
          window.localStorage.removeItem(SESSION_KEY)
        }
        this.#revokeRemoteSession()
        return
      }
      this.#ownsRemoteSession(connection)
    }
    window.addEventListener("storage", this.#storageListener)
  }

  #disposeSession() {
    if (this.#storageListener) window.removeEventListener("storage", this.#storageListener)
    this.#storageListener = undefined
    if (this.#session?.remote) {
      const connection = this.#session.remote
      disposedConnections.add(connection)
      this.#remoteSigner?.close()
      this.#remoteSigner = undefined
      remoteSigners.delete(connection)
    }
    const state = this.#session?.state
    if (state instanceof UserState) {
      state.off("change")
      state.destroy()
    }
  }

  logout() {
    if (!this.#session) return
    const connection = this.#session.remote
    if (connection && !this.#ownsRemoteSession(connection)) return
    this.#disposeSession()
    this.#session = undefined
    this.#save()
  }

  takeSnapshot() {
    return this.#session ? { ...this.#session } : undefined
  }

  setColor(color: string) {
    if (!this.#session) return
    this.#session.color = color
    this.#save()
  }

  update(fn: (s: LoginSession) => void) {
    if (!this.#session) return
    fn(this.#session)
    this.#save()
  }

  #save() {
    if (this.#session?.remote && !this.#ownsRemoteSession(this.#session.remote)) return
    if (this.#session) {
      const ses = { ...this.#session } as Record<string, unknown>
      if (this.#session.state instanceof UserState) {
        ses.state = this.#session.state.serialize()
      }
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(ses))
    } else {
      window.localStorage.removeItem(SESSION_KEY)
    }
    this.notifyChange()
  }
}

export function getPublisher(session: LoginSession) {
  const signer = getSigner(session)
  if (signer) {
    return new EventPublisher(signer, session.pubkey)
  }
}

export function getSigner(session: LoginSession) {
  switch (session?.type) {
    case LoginType.Nip7: {
      return new Nip7Signer()
    }
    case LoginType.PrivateKey: {
      return new PrivateKeySigner(unwrap(session.privateKey))
    }
    case LoginType.Nip46: {
      const connection = unwrap(session.remote)
      if (disposedConnections.has(connection)) return
      return remoteSigners.get(connection)?.()
    }
  }
}

export const Login = new LoginStore()
