import { useProfileBadges } from "@/hooks/badges"
import { findTag } from "@/utils"
import { NostrLink, type TaggedNostrEvent } from "@snort/system"
import { useEventFeed } from "@snort/system-react"

export default function AwardedChatBadge({ ev, pubkey }: { ev: TaggedNostrEvent; pubkey: string }) {
  const aTag = ev.tags.find(a => a[0] === "a")
  const badgeLink = NostrLink.fromTag(aTag ?? ["a", ""])
  const badge = useEventFeed(badgeLink)
  const image = findTag(badge, "image")
  const name = findTag(badge, "name")

  const profileBadges = useProfileBadges(pubkey)

  if (!aTag) return null
  return badge && profileBadges.isAccepted(badgeLink) && <img src={image} className="h-4" title={name} alt={name} />
}
