import { useMemo } from "react";
import { RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { GOAL } from "@/const";

export function useZapGoal(id?: string) {
  const sub = useMemo(() => {
    if (!id) return null;
    const b = new RequestBuilder(`goal:${id.slice(0, 12)}`);
    b.withFilter().kinds([GOAL]).ids([id]);
    return b;
  }, [id]);

  const data = useRequestBuilder(sub);
  return data.at(0);
}

export function useGoals(pubkey?: string, leaveOpen = false) {
  const sub = useMemo(() => {
    if (!pubkey) return null;
    const b = new RequestBuilder(`goals:${pubkey.slice(0, 12)}`);
    b.withOptions({ leaveOpen });
    b.withFilter().kinds([GOAL]).authors([pubkey]);
    return b;
  }, [pubkey, leaveOpen]);

  const data = useRequestBuilder(sub);
  return data;
}
