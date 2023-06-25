import "./profile.css";
import { useUserProfile } from "@snort/system-react";
import { UserMetadata } from "@snort/system";
import { hexToBech32 } from "@snort/shared";
import { System } from "index";

export interface ProfileOptions {
  showName?: boolean;
  showAvatar?: boolean;
  suffix?: string;
  overrideName?: string;
}

export function getName(pk: string, user?: UserMetadata) {
  const shortPubkey = hexToBech32("npub", pk).slice(0, 12);
  if ((user?.display_name?.length ?? 0) > 0) {
    return user?.display_name;
  }
  if ((user?.name?.length ?? 0) > 0) {
    return user?.name;
  }
  return shortPubkey;
}

export function Profile({
  pubkey,
  options,
}: {
  pubkey: string;
  options?: ProfileOptions;
}) {
  const profile = useUserProfile(System, pubkey);

  return (
    <div className="profile">
      {(options?.showAvatar ?? true) && (
        <img alt={profile?.name || pubkey} src={profile?.picture ?? ""} />
      )}
      {(options?.showName ?? true) &&
        (options?.overrideName ?? getName(pubkey, profile))}
    </div>
  );
}
