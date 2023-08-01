import { useMemo } from "react";

import {
  NostrPrefix,
  ReplaceableNoteStore,
  RequestBuilder,
  type NostrLink,
} from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

import { System } from "index";

export function useAddress(kind: number, pubkey: string, identifier: string) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`event:${kind}:${identifier}`);
    b.withFilter().kinds([kind]).authors([pubkey]).tag("d", [identifier]);
    return b;
  }, [kind, pubkey, identifier]);

  const { data } = useRequestBuilder<ReplaceableNoteStore>(
    System,
    ReplaceableNoteStore,
    sub
  );

  return data;
}

export function useEvent(link: NostrLink) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`event:${link.id.slice(0, 12)}`);
    if (link.type === NostrPrefix.Address) {
      const f = b.withFilter().tag("d", [link.id]);
      if (link.author) {
        f.authors([link.author]);
      }
      if (link.kind) {
        f.kinds([link.kind]);
      }
    } else {
      const f = b.withFilter().ids([link.id]);
      if (link.relays) {
        link.relays.slice(0, 2).forEach((r) => f.relay(r));
      }
      if (link.author) {
        f.authors([link.author]);
      }
    }
    return b;
  }, [link]);

  const { data } = useRequestBuilder<ReplaceableNoteStore>(
    System,
    ReplaceableNoteStore,
    sub
  );

  return data;
}
