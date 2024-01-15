import { useMemo } from "react";

import { RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

import { MUTED } from "@/const";
import { getTagValues } from "@/utils";

export function useMutedPubkeys(host?: string, leaveOpen = false) {
  const mutedSub = useMemo(() => {
    if (!host) return null;
    const rb = new RequestBuilder(`muted:${host}`);
    rb.withOptions({ leaveOpen });
    rb.withFilter().kinds([MUTED]).authors([host]);
    return rb;
  }, [host]);

  const muted = useRequestBuilder(mutedSub);
  const mutedPubkeys = useMemo(() => {
    return new Set(getTagValues(muted?.at(0)?.tags ?? [], "p"));
  }, [muted]);

  return mutedPubkeys;
}
