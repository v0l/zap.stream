import { useMemo } from "react";
import {
  RequestBuilder,
  FlatNoteStore,
  NostrEvent,
  EventKind,
  NostrLink,
} from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { GOAL } from "const";
import { System } from "index";
import { findTag } from "utils";

export function useGoal(link: NostrLink, leaveOpen = true) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`goals:${link.author!.slice(0, 12)}`);
    b.withOptions({ leaveOpen });
    b.withFilter()
      .kinds([GOAL])
      .tag("a", [`${link.kind}:${link.author!}:${link.id}`]);
    return b;
  }, [link]);

  const { data } = useRequestBuilder<FlatNoteStore>(System, FlatNoteStore, sub);

  return data?.at(0);
}

export function useGoalZaps(goal: NostrEvent) {
  const a = findTag(goal, "a") ?? "";
  const sub = useMemo(() => {
    const b = new RequestBuilder(`goal-zaps:${goal.id.slice(0, 12)}`);
    b.withFilter()
      .kinds([EventKind.ZapReceipt])
      .tag("e", [goal.id])
      .tag("p", [goal.pubkey]); // todo: ability to tag one or more p in goals?
    return b;
  }, [goal]);

  const { data } = useRequestBuilder<FlatNoteStore>(System, FlatNoteStore, sub);

  return data ?? [];
}
