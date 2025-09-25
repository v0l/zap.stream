import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useUserProfile } from "@snort/system-react";
import { CachedMetadata, UserMetadata } from "@snort/system";
import { hexToBech32 } from "@snort/shared";
import { useInView } from "react-intersection-observer";
import { Avatar } from "./avatar";
import classNames from "classnames";
import { profileLink } from "@/utils";

export interface ProfileOptions {
  showName?: boolean;
  showAvatar?: boolean;
  suffix?: string;
  overrideName?: string;
}

export function getName(pk: string, user?: UserMetadata) {
  const npub = hexToBech32("npub", pk);
  const shortPubkey = npub.slice(0, 12);
  if ((user?.name?.length ?? 0) > 0) {
    return user?.name;
  }
  if ((user?.display_name?.length ?? 0) > 0) {
    return user?.display_name;
  }
  return shortPubkey;
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
  pubkey: string;
  icon?: ReactNode;
  className?: string;
  avatarClassname?: string;
  options?: ProfileOptions;
  title?: string;
  linkToProfile?: boolean;
  avatarSize?: number;
  gap?: number;
  profile?: CachedMetadata;
}) {
  const { inView, ref } = useInView({ triggerOnce: true });
  const pLoaded = useUserProfile(inView && !profile ? pubkey : undefined) ?? profile;
  const showAvatar = options?.showAvatar ?? true;
  const showName = options?.showName ?? true;
  const isAnon = pubkey === "anon";
  const content = (
    <>
      {showAvatar && <Avatar user={pLoaded} pubkey={pubkey} className={avatarClassname} size={avatarSize ?? 24} />}
      {icon}
      {showName && <span>{isAnon ? options?.overrideName ?? "Anon" : getName(pubkey, pLoaded)}</span>}
    </>
  );

  const cls = classNames("flex items-center align-bottom font-medium", `gap-${gap ?? 2}`, className);
  return isAnon || linkToProfile === false ? (
    <div className={cls} ref={ref} title={title}>
      {content}
    </div>
  ) : (
    <Link to={profileLink(pLoaded, pubkey)} className={cls} ref={ref} title={title}>
      {content}
    </Link>
  );
}
