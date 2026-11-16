import { useProfileBadges } from "@/hooks/badges"
import { findTag, safeMediaUrl } from "@/utils"
import { NostrLink, type TaggedNostrEvent } from "@snort/system"
import { useEventFeed } from "@snort/system-react"
import { useMemo } from "react"

export default function AwardedChatBadge({ ev, pubkey }: { ev: TaggedNostrEvent; pubkey: string }) {
  const aTag = ev.tags.find(a => a[0] === "a")
  const badgeLink = useMemo(() => NostrLink.fromTag(aTag ?? ["a", ""]), [aTag?.[1]])
  const badge = useEventFeed(badgeLink)
  const image = safeMediaUrl(findTag(badge, "image"))
  const name = findTag(badge, "name")

  const profileBadges = useProfileBadges(pubkey)

  if (!aTag) return null
  return badge && profileBadges.isAccepted(badgeLink) && image && <img src={image} className="h-4" title={name} alt={name} />
}
