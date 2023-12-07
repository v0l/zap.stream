import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useUserProfile } from "@snort/system-react";
import { UserMetadata } from "@snort/system";
import { hexToBech32 } from "@snort/shared";
import { useInView } from "react-intersection-observer";
import { Avatar } from "./avatar";
import classNames from "classnames";

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
}: {
  pubkey: string;
  icon?: ReactNode;
  className?: string;
  avatarClassname?: string;
  options?: ProfileOptions;
  linkToProfile?: boolean;
  avatarSize?: number;
}) {
  const { inView, ref } = useInView({ triggerOnce: true });
  const pLoaded = useUserProfile(inView ? pubkey : undefined);
  const showAvatar = options?.showAvatar ?? true;
  const showName = options?.showName ?? true;
  const isAnon = pubkey === "anon";
  const content = (
    <>
      {showAvatar && <Avatar user={pLoaded} pubkey={pubkey} className={avatarClassname} size={avatarSize ?? 24} />}
      {icon}
      {showName && <span>{isAnon ? (options?.overrideName ?? "Anon") : getName(pubkey, pLoaded)}</span>}
    </>
  );

  const cls = classNames("flex gap-1 items-center align-bottom font-medium", className);
  return isAnon || linkToProfile === false ? (
    <div className={cls} ref={ref}>
      {content}
    </div>
  ) : (
    <Link to={`/p/${hexToBech32("npub", pubkey)}`} className={cls} ref={ref}>
      {content}
    </Link>
  );
}
