import { hexToBech32 } from "@snort/shared"
import type { UserMetadata } from "@snort/system"

export function getName(pk: string, user?: UserMetadata) {
  const npub = hexToBech32("npub", pk)
  const shortPubkey = npub.slice(0, 12)
  if ((user?.name?.length ?? 0) > 0) {
    return user?.name
  }
  if ((user?.display_name?.length ?? 0) > 0) {
    return user?.display_name
  }
  return shortPubkey
}
