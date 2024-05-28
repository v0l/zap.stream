import { useMemo } from "react";

import { EventKind, NostrLink, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

export function useMutedPubkeys(host?: string, leaveOpen = false) {
  const mutedSub = useMemo(() => {
    if (!host) return null;
    const rb = new RequestBuilder(`muted:${host}`);
    rb.withOptions({ leaveOpen });
    rb.withFilter().kinds([EventKind.MuteList]).authors([host]);
    return rb;
  }, [host]);

  const muted = useRequestBuilder(mutedSub);
  const mutedPubkeys = useMemo(() => {
    return muted.flatMap(a => NostrLink.fromAllTags(a.tags));
  }, [muted]);

  return mutedPubkeys;
}
