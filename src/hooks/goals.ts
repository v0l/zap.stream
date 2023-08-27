import { useMemo } from "react";
import {
  EventKind,
  NostrEvent,
  RequestBuilder,
  NoteCollection,
  ReplaceableNoteStore,
  NostrLink,
  parseZap,
} from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { unwrap } from "@snort/shared";
import { GOAL } from "const";
import { System } from "index";

export function useZaps(goal: NostrEvent, leaveOpen = false) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`goal-zaps:${goal.id.slice(0, 12)}`);
    b.withOptions({ leaveOpen });
    b.withFilter()
      .kinds([EventKind.ZapReceipt])
      .tag("e", [goal.id])
      .since(goal.created_at);
    return b;
  }, [goal, leaveOpen]);

  const { data } = useRequestBuilder(NoteCollection, sub);

  return (
    data
      ?.map((ev) => parseZap(ev, System.ProfileLoader.Cache))
      .filter((z) => z && z.valid) ?? []
  );
}

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
