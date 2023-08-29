import { ParsedZap } from "@snort/system";
import useTopZappers from "hooks/top-zappers";
import { formatSats } from "number";
import { Icon } from "./icon";
import { Profile } from "./profile";

export function TopZappers({ zaps, limit }: { zaps: ParsedZap[]; limit?: number }) {
  const zappers = useTopZappers(zaps);

  return (
    <>
      {zappers.slice(0, limit ?? 10).map(({ pubkey, total }) => {
        return (
          <div className="top-zapper" key={pubkey}>
            {pubkey === "anon" ? (
              <p className="top-zapper-name">Anon</p>
            ) : (
              <Profile pubkey={pubkey} options={{ showName: false }} />
            )}
            <Icon name="zap-filled" className="zap-icon" />
            <p className="top-zapper-amount">{formatSats(total)}</p>
          </div>
        );
      })}
    </>
  );
}
