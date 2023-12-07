import { formatSats } from "@/number";
import { Icon } from "./icon";
import { Profile } from "./profile";
import { FormattedMessage } from "react-intl";

export function ZapperRow({ pubkey, total, showName }: { pubkey: string; total: number; showName?: boolean }) {
  return (
    <div className="flex gap-1 justify-between items-center">
      {pubkey === "anon" ? (
        <span>
          <FormattedMessage defaultMessage="Anon" id="bfvyfs" />
        </span>
      ) : (
        <Profile pubkey={pubkey} options={{ showName }} />
      )}
      <div className="flex items-center gap-2">
        <Icon name="zap-filled" className="text-zap" />
        <span>{formatSats(total)}</span>
      </div>
    </div>
  );
}
