import { useMemo } from "react";

import { EventKind, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

type StatusTag = "general" | "music";

export function useStatus(tag: StatusTag, author?: string, leaveOpen = true) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`status:${tag}:${author}`);
    b.withOptions({ leaveOpen });

    if (author) {
      b.withFilter()
        .kinds([30315 as EventKind])
        .tag("d", [tag])
        .authors([author]);
    }
    return b;
  }, [author]);

  const data = useRequestBuilder(sub);
  return data.at(0);
}
