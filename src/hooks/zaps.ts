import { useMemo } from "react";

import {
  EventKind,
  NoteCollection,
  RequestBuilder,
  parseZap,
} from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

import { System } from "index";

export function useZaps(pubkey: string, leaveOpen = false) {
  const rb = useMemo(() => {
    const rb = new RequestBuilder(`profile-zaps:${pubkey.slice(0, 12)}`);
    rb.withOptions({ leaveOpen });
    rb.withFilter().kinds([EventKind.ZapReceipt]).tag("p", [pubkey]);
    return rb;
  }, [pubkey]);

  const { data } = useRequestBuilder<NoteCollection>(
    System,
    NoteCollection,
    rb
  );

  return (
    data
      ?.map((ev) => parseZap(ev, System.ProfileLoader.Cache))
      .filter((z) => z && z.valid) ?? []
  );
}
