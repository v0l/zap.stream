import { useMemo } from "react";
import { RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { GOAL } from "@/const";

export function useZapGoal(id?: string) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`goal:${id}`);
    if (id) {
      b.withFilter().kinds([GOAL]).ids([id]);
    }
    return b;
  }, [id]);

  const data = useRequestBuilder(sub);
  return data.at(0);
}

export function useGoals(pubkey?: string, leaveOpen?: boolean, limit?: number) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`goals:${pubkey}`);
    b.withOptions({ leaveOpen });

    if (pubkey) {
      b.withFilter().kinds([GOAL]).authors([pubkey]).limit(limit);
    }
    return b;
  }, [pubkey, leaveOpen, limit]);

  return useRequestBuilder(sub);
}
