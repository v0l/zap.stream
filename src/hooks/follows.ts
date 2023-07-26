import { useMemo } from "react";
import { EventKind, ReplaceableNoteStore, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { System } from "index";

export default function useFollows(pubkey: string, leaveOpen = false) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`follows:${pubkey.slice(0, 12)}`);
    b.withOptions({
      leaveOpen,
    })
      .withFilter()
      .authors([pubkey])
      .kinds([EventKind.ContactList]);
    return b;
  }, [pubkey, leaveOpen]);

  const { data } = useRequestBuilder<ReplaceableNoteStore>(
    System,
    ReplaceableNoteStore,
    sub
  );

  const relays = JSON.parse(data?.content ?? "{}");
  return data ? { tags: data.tags, relays } : null
}
