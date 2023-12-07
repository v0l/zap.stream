import { ParsedZap } from "@snort/system";
import useTopZappers from "@/hooks/top-zappers";
import { ZapperRow } from "./zapper-row";

export function TopZappers({ zaps, limit }: { zaps: ParsedZap[]; limit?: number }) {
  const zappers = useTopZappers(zaps);
  return zappers.slice(0, limit ?? 10).map(({ pubkey, total }) => <div className="border rounded-full px-2 py-1 border-gray-1 grow-0 shrink-0 basis-auto font-bold">
    <ZapperRow pubkey={pubkey} total={total} key={pubkey} showName={false} />
  </div>);
}
