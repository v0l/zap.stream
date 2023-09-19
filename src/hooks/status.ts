import { useMemo } from "react";

import { EventKind, ReplaceableNoteStore, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

type StatusTag = "general" | "music";

export function useStatus(tag: StatusTag, author?: string, leaveOpen = true) {
  const sub = useMemo(() => {
    if (!author) return null;
    const b = new RequestBuilder(`status:${tag}:${author.slice(0, 8)}`);
    b.withOptions({ leaveOpen });
    b.withFilter()
      .kinds([30315 as EventKind])
      .tag("d", [tag])
      .authors([author]);
    return b;
  }, [author]);

  const { data } = useRequestBuilder(ReplaceableNoteStore, sub);
  return data;
}
