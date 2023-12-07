import { MetadataCache } from "@snort/system";
import { HTMLProps, useState } from "react";
import classNames from "classnames";
import { getPlaceholder } from "@/utils";

type AvatarProps = HTMLProps<HTMLImageElement> & { size?: number, pubkey: string, user?: MetadataCache };
export function Avatar({ pubkey, size, user, ...props }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const src = user?.picture && !failed ? user.picture : getPlaceholder(pubkey);
  return <img
    {...props}
    className={classNames("aspect-square rounded-full bg-gray-1", props.className)}
    alt={user?.name || user?.pubkey}
    src={src}
    onError={() => setFailed(true)}
    style={{
      width: `${size ?? 40}px`,
      height: `${size ?? 40}px`
    }} />;
}
