import { useMemo } from "react";
import { RequestBuilder, ReplaceableNoteStore, NostrLink } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { unwrap } from "@snort/shared";
import { GOAL } from "const";

export function useZapGoal(host: string, link?: NostrLink, leaveOpen = false) {
  const sub = useMemo(() => {
    if (!link) return null;
    const b = new RequestBuilder(`goals:${host.slice(0, 12)}`);
    b.withOptions({ leaveOpen });
    b.withFilter()
      .kinds([GOAL])
      .authors([host])
      .tag("a", [`${link.kind}:${unwrap(link.author)}:${link.id}`]);
    return b;
  }, [link, leaveOpen]);

  const { data } = useRequestBuilder(ReplaceableNoteStore, sub);

  return data;
}
