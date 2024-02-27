import { ParsedZap } from "@snort/system";
import useTopZappers from "@/hooks/top-zappers";
import { ZapperRow } from "./zapper-row";

export function TopZappers({ zaps, limit, avatarSize, showName, className }: { zaps: ParsedZap[]; limit?: number, avatarSize?: number, showName?: boolean, className?: string }) {
  const zappers = useTopZappers(zaps);
  return zappers.slice(0, limit ?? 10).map(({ pubkey, total }) => (
    <ZapperRow pubkey={pubkey} total={total} key={pubkey} showName={showName ?? false} avatarSize={avatarSize} className={className} />
  ));
}
