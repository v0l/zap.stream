import { useMemo } from "react";

export default function usePlaceholder(pubkey: string) {
  const url = useMemo(() => `https://robohash.v0l.io/${pubkey}.png?set=2`, [pubkey]);
  return url;
}
