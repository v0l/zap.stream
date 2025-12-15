import { useMemo } from "react";
import type { ParsedZap } from "@snort/system";

function totalZapped(pubkey: string, zaps: ParsedZap[]) {
  return zaps.filter(z => (z.anonZap ? pubkey === "anon" : z.sender === pubkey)).reduce((acc, z) => acc + z.amount, 0);
}

export default function useTopZappers(zaps: ParsedZap[]) {
  const zappers = zaps.map(z => (z.anonZap ? "anon" : z.sender)).map(p => p as string);

  const sorted = useMemo(() => {
    const pubkeys = [...new Set([...zappers])];
    const result = pubkeys.map(pubkey => {
      return { pubkey, total: totalZapped(pubkey, zaps) };
    });
    result.sort((a, b) => b.total - a.total);
    return result;
  }, [zaps, zappers]);

  return sorted;
}
