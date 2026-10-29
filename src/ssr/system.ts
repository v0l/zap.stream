import { mapEventToProfile, type CachedMetadata, type RequestBuilder, type TaggedNostrEvent } from "@snort/system"

declare global {
  function relayQuery(filters: string): string
}

function ask(filters: unknown[]): TaggedNostrEvent[] {
  const events = JSON.parse(relayQuery(JSON.stringify(filters))) as TaggedNostrEvent[]
  return events.map(ev => ({ ...ev, relays: [] }))
}

class ServerQuery {
  snapshot: TaggedNostrEvent[]
  progress = 1
  constructor(snapshot: TaggedNostrEvent[]) {
    this.snapshot = snapshot
  }
  on() {}
  off() {}
  once() {}
  start() {}
  cancel() {}
  uncancel() {}
  flush() {}
}

const socialGraph = {
  getFollowDistance: () => 1000,
  followedByFriendsCount: () => 0,
  followedByFriends: () => new Set<string>(),
  size: () => ({ users: 0 }),
  setRoot: () => undefined,
  handleEvent: () => undefined,
}

export class ServerSystem {
  #queries: Record<string, TaggedNostrEvent[]> = {}
  #profileEvents: Record<string, TaggedNostrEvent | null> = {}
  #profiles = new Map<string, CachedMetadata>()

  checkSigs = false
  config = { socialGraphInstance: socialGraph, profiles: { getFromCache: (p?: string) => this.profile(p) } }
  pool = new Map()
  cacheRelay = undefined
  requestRouter = undefined
  traceTimeline = undefined

  profile(pubkey?: string) {
    if (!pubkey) return undefined
    if (!(pubkey in this.#profileEvents)) {
      const ev = ask([{ kinds: [0], authors: [pubkey], limit: 1 }])[0]
      this.#profileEvents[pubkey] = ev ?? null
      const profile = ev ? mapEventToProfile(ev) : undefined
      if (profile) this.#profiles.set(pubkey, profile)
    }
    return this.#profiles.get(pubkey)
  }

  readonly profileLoader = {
    cache: {
      getFromCache: (pubkey?: string) => this.profile(pubkey),
      get: (pubkey?: string) => this.profile(pubkey),
      subscribe: () => () => {},
      set: async () => {},
    },
    TrackKeys: () => {},
    UntrackKeys: () => {},
  }

  reset() {
    this.#queries = {}
    this.#profileEvents = {}
    this.#profiles = new Map()
  }

  data() {
    const profiles: Record<string, TaggedNostrEvent> = {}
    for (const [pubkey, ev] of Object.entries(this.#profileEvents)) if (ev) profiles[pubkey] = ev
    return { queries: this.#queries, profiles }
  }

  Query(rb: RequestBuilder) {
    if (!(rb.id in this.#queries)) this.#queries[rb.id] = ask(rb.buildRaw())
    return new ServerQuery(this.#queries[rb.id])
  }

  GetQuery() {
    return undefined
  }
  async Fetch(rb: RequestBuilder) {
    return ask(rb.buildRaw())
  }
  async FetchAll() {}
  async Init() {}
  hydrateQuery() {}
  getHydrationData() {
    return this.#queries
  }
  HandleEvent() {}
  async ConnectToRelay() {}
  DisconnectRelay() {}
  async BroadcastEvent() {
    return []
  }
  async WriteOnceToRelay() {
    return { ok: false }
  }
  on() {}
  off() {}
}
