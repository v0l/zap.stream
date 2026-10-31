import type { ReactNode } from "react"
import { Link } from "react-router"
import { useUserProfile } from "@snort/system-react"
import type { CachedMetadata } from "@snort/system"
import { getName } from "./profile-name"
import { Avatar } from "./avatar"
import classNames from "classnames"
import { profileLink } from "@/utils"

export { getName }

export interface ProfileOptions {
  showName?: boolean
  showAvatar?: boolean
  suffix?: string
  overrideName?: string
}

export function Profile({
  pubkey,
  icon,
  className,
  avatarClassname,
  options,
  linkToProfile,
  avatarSize,
  title,
  gap,
  profile,
}: {
  pubkey: string
  icon?: ReactNode
  className?: string
  avatarClassname?: string
  options?: ProfileOptions
  title?: string
  linkToProfile?: boolean
  avatarSize?: number
  gap?: number
  profile?: CachedMetadata
}) {
  const pLoaded = useUserProfile(!profile ? pubkey : undefined) ?? profile
  const showAvatar = options?.showAvatar ?? true
  const showName = options?.showName ?? true
  const isAnon = pubkey === "anon"
  const content = (
    <>
      {showAvatar && <Avatar user={pLoaded} pubkey={pubkey} className={avatarClassname} size={avatarSize ?? 24} />}
      {icon}
      {showName && <span>{isAnon ? (options?.overrideName ?? "Anon") : getName(pubkey, pLoaded)}</span>}
    </>
  )

  const cls = classNames("flex items-center align-bottom font-medium", `gap-${gap ?? 2}`, className)
  return isAnon || linkToProfile === false ? (
    <div className={cls} title={title}>
      {content}
    </div>
  ) : (
    <Link to={profileLink(pLoaded, pubkey)} className={cls} title={title}>
      {content}
    </Link>
  )
}
