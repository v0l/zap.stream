import { MetadataCache } from "@snort/system";

export function Avatar({ user, avatarClassname }: { user: MetadataCache; avatarClassname: string }) {
  return <img className={avatarClassname} alt={user?.name || user?.pubkey} src={user?.picture ?? ""} />;
}
