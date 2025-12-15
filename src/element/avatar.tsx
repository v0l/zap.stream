import { type HTMLProps, useState } from "react";
import classNames from "classnames";
import { getPlaceholder } from "@/utils";
import type { UserMetadata } from "@snort/system";
import useImgProxy from "@/hooks/img-proxy";

type AvatarProps = HTMLProps<HTMLImageElement> & { size?: number; pubkey: string; user?: UserMetadata };
export function Avatar({ pubkey, size, user, ...props }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const { proxy } = useImgProxy();
  const src = user?.picture && !failed ? proxy(user.picture, size ?? 40) : getPlaceholder(pubkey);
  return (
    <img
      {...props}
      className={classNames("aspect-square rounded-full bg-layer-1 object-cover", props.className)}
      alt={user?.name}
      src={src}
      onError={() => setFailed(true)}
      style={{
        width: `${size ?? 40}px`,
        minWidth: `${size ?? 40}px`,
        height: `${size ?? 40}px`,
      }}
    />
  );
}
