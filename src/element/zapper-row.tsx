import { formatSats } from "@/number";
import { Icon } from "./icon";
import { Profile } from "./profile";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";

export function ZapperRow({
  pubkey,
  total,
  showName,
  avatarSize,
  className,
}: {
  pubkey: string;
  total: number;
  showName?: boolean;
  avatarSize?: number;
  className?: string;
}) {
  return (
    <div className={classNames(className, "flex gap-1 justify-between items-center")}>
      {pubkey === "anon" ? (
        <span style={{ height: avatarSize }}>
          <FormattedMessage defaultMessage="Anon" id="bfvyfs" />
        </span>
      ) : (
        <Profile pubkey={pubkey} options={{ showName }} avatarSize={avatarSize} />
      )}
      <div className="flex items-center gap-2">
        <Icon name="zap-filled" className="text-zap" />
        <span>{formatSats(total)}</span>
      </div>
    </div>
  );
}
