import { EventExt, Nip46Signer, PrivateKeySigner, type EventSigner, type NostrEvent } from "@snort/system"
import { hexToBytes } from "@noble/hashes/utils.js"
import { schnorr } from "@noble/curves/secp256k1.js"
import { RemoteApprovals } from "./remote-approvals"

interface BunkerPointer {
  pubkey: string
  relays: string[]
  secret: string | null
}

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
      !!new PrivateKeySigner(c.clientSecret).getPubKey()
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
    !EventExt.verify({ id, sig, pubkey: author, kind, created_at, content, tags }) ||
    !schnorr.verify(hexToBytes(sig), hexToBytes(id), hexToBytes(author)) ||
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
  readonly controller = new AbortController()
  readonly signer: Nip46Signer
  readonly timeoutMs: number
  #onAbort?: () => void
  #requests = 0
  #approvalOwner = Symbol()

  constructor(
    config: string,
    readonly client: PrivateKeySigner,
    readonly options: RemoteOptions,
  ) {
    this.timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT
    // Let the remote signer request approval per operation instead of Snort's app-specific defaults.
    this.signer = new Nip46Signer(config, client, { timeoutMs: this.timeoutMs, permissions: "" })
    this.signer.on("oauth", url => {
      if (this.controller.signal.aborted) return
      const approvedUrl = RemoteApprovals.show(this.#approvalOwner, url, () => this.close())
      if (!approvedUrl) return this.close()
      try {
        this.options.onAuth?.(approvedUrl)
      } catch {
        this.close()
      }
    })
    this.#onAbort = () => this.close()
    options.signal?.addEventListener("abort", this.#onAbort, { once: true })
    if (options.signal?.aborted) this.close()
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
    void this.signer.close().catch(() => undefined)
  }
}

export class RemoteSigner implements EventSigner {
  #ready?: Promise<void>

  private constructor(
    readonly connection: RemoteConnection,
    private readonly transport: RemoteTransport,
    private readonly restored = false,
  ) {}

  static restore(connection: RemoteConnection, options: RemoteOptions = {}): RemoteSigner {
    options.signal?.throwIfAborted()
    if (!isRemoteConnection(connection)) throw new Error("Remote signer session is invalid; connect again")
    const url = new URL(`bunker://${connection.bunker.pubkey}`)
    url.searchParams.set("relay", connection.bunker.relays[0])
    const transport = new RemoteTransport(url.href, new PrivateKeySigner(connection.clientSecret), options)
    try {
      return new RemoteSigner(connection, transport, true)
    } catch (error) {
      transport.close()
      throw error
    }
  }

  static async connect(input: string, options: RemoteOptions = {}): Promise<RemoteSigner> {
    options.signal?.throwIfAborted()
    parseBunkerConnection(input)
    const transport = new RemoteTransport(input.trim(), PrivateKeySigner.random(), options)
    try {
      await transport.request(() => transport.signer.init())
      return await RemoteSigner.finish(transport)
    } catch (error) {
      transport.close()
      throw error
    }
  }

  static pair(relay: string, origin: string, options: RemoteOptions = {}) {
    options.signal?.throwIfAborted()
    const relayUrl = validateRelay(relay)
    const client = PrivateKeySigner.random()
    const params = new URLSearchParams({
      relay: relayUrl,
      secret: PrivateKeySigner.random().privateKey,
      name: "zap.stream",
      url: origin,
    })
    const uri = `nostrconnect://${client.getPubKey()}?${params}`
    const transport = new RemoteTransport(uri, client, options)
    const connected = transport
      .request(async () => {
        await transport.signer.init()
        return await RemoteSigner.finish(transport)
      })
      .catch(error => {
        transport.close()
        throw error
      })
    return { uri, connected, close: () => transport.close() }
  }

  private static async finish(transport: RemoteTransport): Promise<RemoteSigner> {
    const pubkey = await transport.request(() => transport.signer.getPubKey())
    if (!HEX_KEY.test(pubkey)) throw new Error("The signer returned an invalid public key")
    const remotePubkey = transport.signer.remotePubkey
    if (!remotePubkey) throw new Error("The signer did not establish a connection")
    const connection = {
      clientSecret: transport.client.privateKey,
      bunker: { pubkey: remotePubkey, relays: [...transport.signer.relays], secret: null },
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
        if (this.restored) await this.transport.signer.init(false)
        const pubkey = await this.transport.signer.getPubKey()
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
    const signed = await this.transport.request(() =>
      this.transport.signer.sign({ ...template, pubkey: this.connection.pubkey, id: "" }),
    )
    return validateSigningResult(signed, template, this.connection.pubkey)
  }

  private async crypto(
    method: "nip4Encrypt" | "nip4Decrypt" | "nip44Encrypt" | "nip44Decrypt",
    content: string,
    key: string,
  ) {
    await this.init()
    return await this.transport.request(() => this.transport.signer[method](content, key))
  }

  nip4Encrypt(content: string, key: string) {
    return this.crypto("nip4Encrypt", content, key)
  }
  nip4Decrypt(content: string, key: string) {
    return this.crypto("nip4Decrypt", content, key)
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
