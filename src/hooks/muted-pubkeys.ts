import { NostrPrefix } from "@snort/shared"
import { NostrLink, type ToNostrEventTag } from "@snort/system"

export function mutedPubkeys(muted: ReadonlyArray<ToNostrEventTag>) {
  const keys = new Set<string>()
  for (const link of muted) {
    if (link instanceof NostrLink && (link.type === NostrPrefix.Profile || link.type === NostrPrefix.PublicKey)) {
      keys.add(link.id)
    }
  }
  return keys
}
