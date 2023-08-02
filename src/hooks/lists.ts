import { useMemo } from "react";

import { RequestBuilder, ReplaceableNoteStore } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

import { MUTED } from "const";
import { getTagValues } from "utils";
import { System } from "index";

export function useMutedPubkeys(host?: string, leaveOpen = false) {
  const mutedSub = useMemo(() => {
    if (!host) return null;
    const rb = new RequestBuilder(`muted:${host}`);
    rb.withOptions({ leaveOpen });
    rb.withFilter().kinds([MUTED]).authors([host]);
    return rb;
  }, [host]);

  const { data: muted } = useRequestBuilder<ReplaceableNoteStore>(
    System,
    ReplaceableNoteStore,
    mutedSub
  );
  const mutedPubkeys = useMemo(() => {
    return new Set(getTagValues(muted?.tags ?? [], "p"));
  }, [muted]);

  return mutedPubkeys;
}
