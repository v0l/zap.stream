import { useMemo } from "react";
import {
  RequestBuilder,
  ReplaceableNoteStore,
  NostrLink,
} from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { GOAL } from "const";
import { System } from "index";

export function useZapGoal(host: string, link: NostrLink, leaveOpen = false) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`goals:${host.slice(0, 12)}`);
    b.withOptions({ leaveOpen });
    b.withFilter()
      .kinds([GOAL])
      .authors([host])
      .tag("a", [`${link.kind}:${link.author!}:${link.id}`]);
    return b;
  }, [link, leaveOpen]);

  const { data } = useRequestBuilder<ReplaceableNoteStore>(
    System,
    ReplaceableNoteStore,
    sub
  );

  return data;
}
