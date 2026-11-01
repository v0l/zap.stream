import "./badge.css"
import type { NostrEvent } from "@snort/system"
import { findTag, safeMediaUrl } from "@/utils"

export function BadgeInfo({ ev }: { ev: NostrEvent }) {
  const name = findTag(ev, "name") || findTag(ev, "d")
  const description = findTag(ev, "description") ?? ""
  const thumb = safeMediaUrl(findTag(ev, "thumb"))
  const image = safeMediaUrl(findTag(ev, "image"))
  const badgeImage = thumb ?? image
  return (
    <div className="badge">
      {badgeImage && <img className="badge-thumbnail" src={badgeImage} alt={name} />}
      <div className="badge-details">
        <h4 className="badge-name">{name}</h4>
        {description?.length > 0 && <div className="badge-description">{description}</div>}
      </div>
    </div>
  )
}
