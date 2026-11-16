import type { EventSigner, NostrEvent } from "@snort/system"
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js"
import { BunkerSigner, createNostrConnectURI, type BunkerPointer } from "nostr-tools/nip46"
import { generateSecretKey, getPublicKey, verifyEvent } from "nostr-tools/pure"
import { SimplePool } from "nostr-tools/pool"
import { RemoteApprovals } from "./remote-approvals"

const HEX_KEY = /^[0-9a-f]{64}$/
const REQUEST_TIMEOUT = 120_000

export interface RemoteConnection {
  clientSecret: string
  bunker: BunkerPointer
  pubkey: string
}

export interface RemoteOptions {
  signal?: AbortSignal
  onAuth?: (url: string) => void
  timeoutMs?: number
}

export function validateRelay(input: string): string {
  const url = new URL(input)
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  if ((url.protocol !== "wss:" && !(url.protocol === "ws:" && local)) || url.username || url.password || url.hash) {
    throw new Error("Use a wss:// relay, or ws:// on localhost")
  }
  return url.href
}

export function parseBunkerConnection(input: string): BunkerPointer {
  if (input.length > 8192) throw new Error("Bunker link is too long")
  const url = new URL(input.trim())
  const pubkey = url.hostname.toLowerCase()
  const relays = [...new Set(url.searchParams.getAll("relay").map(validateRelay))]
  if (
    url.protocol !== "bunker:" ||
    !HEX_KEY.test(pubkey) ||
    !relays.length ||
    relays.length > 8 ||
    url.username ||
    url.password ||
    url.port ||
    url.hash
  ) {
    throw new Error("Paste a bunker:// link from your signer, including its relay")
  }
  return { pubkey, relays, secret: url.searchParams.get("secret") }
}

export function isRemoteConnection(value: unknown): value is RemoteConnection {
  try {
    if (!value || typeof value !== "object") return false
    const c = value as RemoteConnection
    return (
      typeof c.clientSecret === "string" &&
      HEX_KEY.test(c.clientSecret) &&
      typeof c.pubkey === "string" &&
      HEX_KEY.test(c.pubkey) &&
      typeof c.bunker?.pubkey === "string" &&
      HEX_KEY.test(c.bunker.pubkey) &&
      c.bunker.secret === null &&
      Array.isArray(c.bunker.relays) &&
      c.bunker.relays.length > 0 &&
      c.bunker.relays.length <= 8 &&
      c.bunker.relays.every(r => typeof r === "string" && !!validateRelay(r)) &&
      !!getPublicKey(hexToBytes(c.clientSecret))
    )
  } catch {
    return false
  }
}

export function validateSigningResult(
  signed: NostrEvent,
  template: Pick<NostrEvent, "kind" | "created_at" | "tags" | "content">,
  pubkey: string,
): NostrEvent {
  const { id, sig, pubkey: author, kind, created_at, content, tags } = signed
  if (
    !verifyEvent({ id, sig, pubkey: author, kind, created_at, content, tags }) ||
    signed.pubkey !== pubkey ||
    signed.kind !== template.kind ||
    signed.created_at !== template.created_at ||
    signed.content !== template.content ||
    JSON.stringify(signed.tags) !== JSON.stringify(template.tags)
  ) {
    throw new Error("The signer returned a different identity or event")
  }
  return signed
}

class RemoteTransport {
  readonly pool = new SimplePool()
  readonly controller = new AbortController()
  signer?: BunkerSigner
  readonly timeoutMs: number
  #onAbort?: () => void
  #requests = 0
  #approvalOwner = Symbol()

  get bunker() {
    if (!this.signer) throw new Error("Remote signer is not connected")
    return this.signer
  }

  constructor(
    readonly key: Uint8Array,
    readonly options: RemoteOptions,
  ) {
    this.timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT
    this.#onAbort = () => this.close()
    options.signal?.addEventListener("abort", this.#onAbort, { once: true })
    if (options.signal?.aborted) this.close()
  }

  get params() {
    return {
      pool: this.pool,
      skipSwitchRelays: true,
      onauth: (url: string) => {
        if (this.controller.signal.aborted) return
        const approvedUrl = RemoteApprovals.show(this.#approvalOwner, url, () => this.close())
        if (!approvedUrl) {
          this.close()
          return
        }
        try {
          this.options.onAuth?.(approvedUrl)
        } catch {
          this.close()
        }
      },
    }
  }

  async request<T>(run: () => Promise<T>): Promise<T> {
    const signal = this.controller.signal
    if (signal.aborted) throw new Error("Remote signer connection was closed")
    this.#requests++
    let timer: ReturnType<typeof setTimeout> | undefined
    let onAbort: () => void = () => {}
    try {
      return await Promise.race([
        new Promise<never>((_, reject) => {
          onAbort = () => reject(new Error("Remote signer connection was closed"))
          signal.addEventListener("abort", onAbort, { once: true })
          timer = setTimeout(() => {
            reject(new Error("Remote signer timed out. Check your signer and try again."))
            this.close()
          }, this.timeoutMs)
        }),
        run(),
      ])
    } finally {
      clearTimeout(timer)
      signal.removeEventListener("abort", onAbort)
      if (--this.#requests === 0) RemoteApprovals.clear(this.#approvalOwner)
    }
  }

  close() {
    if (this.controller.signal.aborted) return
    this.controller.abort()
    RemoteApprovals.clear(this.#approvalOwner)
    if (this.#onAbort) this.options.signal?.removeEventListener("abort", this.#onAbort)
    void this.signer?.close()
    setTimeout(() => this.pool.destroy(), 0)
    this.key.fill(0)
  }
}

export class RemoteSigner implements EventSigner {
  #ready?: Promise<void>

  private constructor(
    readonly connection: RemoteConnection,
    private readonly transport: RemoteTransport,
  ) {}

  static restore(connection: RemoteConnection, options: RemoteOptions = {}): RemoteSigner {
    options.signal?.throwIfAborted()
    if (!isRemoteConnection(connection)) throw new Error("Remote signer session is invalid; connect again")
    const transport = new RemoteTransport(hexToBytes(connection.clientSecret), options)
    try {
      transport.signer = BunkerSigner.fromBunker(transport.key, connection.bunker, transport.params)
      return new RemoteSigner(connection, transport)
    } catch (error) {
      transport.close()
      throw error
    }
  }

  static async connect(input: string, options: RemoteOptions = {}): Promise<RemoteSigner> {
    options.signal?.throwIfAborted()
    const pointer = parseBunkerConnection(input)
    const transport = new RemoteTransport(generateSecretKey(), options)
    try {
      transport.signer = BunkerSigner.fromBunker(transport.key, pointer, transport.params)
      const result = await transport.request(() =>
        transport.bunker.sendRequest("connect", [pointer.pubkey, pointer.secret ?? ""]),
      )
      if (result !== "ack" && (!pointer.secret || result !== pointer.secret))
        throw new Error("The signer did not approve this connection")
      return await RemoteSigner.finish(transport)
    } catch (error) {
      transport.close()
      throw error
    }
  }

  static pair(relay: string, origin: string, options: RemoteOptions = {}) {
    options.signal?.throwIfAborted()
    const relayUrl = validateRelay(relay)
    const transport = new RemoteTransport(generateSecretKey(), options)
    const uri = createNostrConnectURI({
      clientPubkey: getPublicKey(transport.key),
      relays: [relayUrl],
      secret: bytesToHex(generateSecretKey()),
      name: "zap.stream",
      url: origin,
    })
    const connected = transport
      .request(async () => {
        transport.signer = await BunkerSigner.fromURI(transport.key, uri, transport.params, transport.controller.signal)
        if (transport.controller.signal.aborted) {
          await transport.signer.close()
          throw new Error("Remote signer connection was closed")
        }
        return await RemoteSigner.finish(transport)
      })
      .catch(error => {
        transport.close()
        throw error
      })
    return { uri, connected, close: () => transport.close() }
  }

  private static async finish(transport: RemoteTransport): Promise<RemoteSigner> {
    const pubkey = await transport.request(() => transport.bunker.getPublicKey())
    if (!HEX_KEY.test(pubkey)) throw new Error("The signer returned an invalid public key")
    const connection = {
      clientSecret: bytesToHex(transport.key),
      bunker: { ...transport.bunker.bp, relays: [...transport.bunker.bp.relays], secret: null },
      pubkey,
    }
    return new RemoteSigner(connection, transport)
  }

  get supports() {
    return ["nip44"]
  }
  get closed() {
    return this.transport.controller.signal.aborted
  }

  async init() {
    if (this.closed) throw new Error("Remote signer connection was closed")
    this.#ready ??= this.transport
      .request(async () => {
        const pubkey = await this.transport.bunker.sendRequest("get_public_key", [])
        if (pubkey !== this.connection.pubkey)
          throw new Error("Your signer identity changed. Log out and connect again.")
      })
      .catch(error => {
        this.close()
        throw error
      })
    return await this.#ready
  }

  async getPubKey() {
    await this.init()
    return this.connection.pubkey
  }

  async sign(event: Pick<NostrEvent, "kind" | "created_at" | "content" | "tags">): Promise<NostrEvent> {
    await this.init()
    const template = {
      kind: event.kind,
      created_at: event.created_at,
      content: event.content,
      tags: event.tags.map(t => [...t]),
    }
    const signed = await this.transport.request(() => this.transport.bunker.signEvent(template))
    return validateSigningResult(signed, template, this.connection.pubkey)
  }

  private async crypto(
    method: "nip04Encrypt" | "nip04Decrypt" | "nip44Encrypt" | "nip44Decrypt",
    content: string,
    key: string,
  ) {
    await this.init()
    return await this.transport.request(() => this.transport.bunker[method](key, content))
  }

  nip4Encrypt(content: string, key: string) {
    return this.crypto("nip04Encrypt", content, key)
  }
  nip4Decrypt(content: string, key: string) {
    return this.crypto("nip04Decrypt", content, key)
  }
  nip44Encrypt(content: string, key: string) {
    return this.crypto("nip44Encrypt", content, key)
  }
  nip44Decrypt(content: string, key: string) {
    return this.crypto("nip44Decrypt", content, key)
  }
  close() {
    this.transport.close()
  }
}
