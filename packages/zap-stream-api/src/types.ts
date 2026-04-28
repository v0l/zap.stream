/**
 * A Nostr event as defined in NIP-01.
 */
export interface NostrEvent {
  id?: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: Array<Array<string>>;
  content: string;
  sig?: string;
}

/**
 * A generic Nostr event signer.
 *
 * Implementations take an unsigned `NostrEvent` (with `pubkey`, `kind`,
 * `created_at`, `tags`, and `content` populated) and return the same
 * event with `id` and `sig` fields filled in.
 *
 * This is the **only** cryptographic dependency of `@zap.stream/api`.
 * Any Nostr library can be used by implementing this single method.
 */
export interface Signer {
  /** The public key (hex) associated with this signer. */
  getPubKey(): string | Promise<string>;

  /**
   * Sign an unsigned Nostr event.
   * Implementations must:
   * 1. Compute the event id (NIP-01 serialization + SHA-256)
   * 2. Sign the id with the private key
   * 3. Return the event with `id` and `sig` populated
   */
  sign(event: NostrEvent): Promise<NostrEvent>;
}

// ─── Utility functions ───────────────────────────────────────────────────────

/** Current unix timestamp in seconds. */
export function unixNow(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Concatenate two arrays, deduplicating items.
 */
export function appendDedupe<T>(a: Array<T>, b?: Array<T>): Array<T> {
  if (!b || b.length === 0) return a;
  const set = new Set(a);
  for (const item of b) {
    set.add(item);
  }
  return Array.from(set);
}

/**
 * Throw if the browser is offline.
 * No-op in non-browser environments.
 */
export function throwIfOffline(): void {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("Offline");
  }
}

/**
 * Build an unsigned Nostr event with the given fields.
 * The `pubkey` is set from the provided `Signer`.
 * The caller must `await signer.sign(event)` to produce a valid event.
 */
export function buildUnsignedEvent(
  pubkey: string,
  kind: number,
  tags: Array<Array<string>>,
  content: string,
  createdAt: number,
): NostrEvent {
  return {
    pubkey,
    kind,
    tags,
    content,
    created_at: createdAt,
  };
}
