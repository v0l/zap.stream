import { useMemo } from "react";
import {
  RequestBuilder,
  FlatNoteStore,
  ParameterizedReplaceableNoteStore,
  NostrLink,
  EventKind,
  parseZap,
} from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { LIVE_STREAM } from "const";
import { findTag } from "utils";
import { System } from "index";

export function useProfile(link: NostrLink, leaveOpen = false) {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`profile:${link.id.slice(0, 12)}`);
    b.withOptions({
      leaveOpen,
    })
      .withFilter()
      .kinds([LIVE_STREAM])
      .authors([link.id]);

    const b2 = new RequestBuilder(`profile-host:${link.id.slice(0, 12)}`);
    b2.withOptions({
      leaveOpen,
    })
      .withFilter()
      .kinds([LIVE_STREAM])
      .tag("p", [link.id]);

    b.add(b2);

    return b;
  }, [link, leaveOpen]);

  const { data: streamsData } =
    useRequestBuilder<ParameterizedReplaceableNoteStore>(
      System,
      ParameterizedReplaceableNoteStore,
      sub
    );
  const streams = streamsData ?? [];

  const addresses = useMemo(() => {
    if (streamsData) {
      return streamsData.map((e) => `${e.kind}:${e.pubkey}:${findTag(e, "d")}`);
    }
    return [];
  }, [streamsData]);

  const zapsSub = useMemo(() => {
    const b = new RequestBuilder(`profile-zaps:${link.id.slice(0, 12)}`);
    b.withOptions({
      leaveOpen,
    })
      .withFilter()
      .kinds([EventKind.ZapReceipt])
      .tag("a", addresses);
    return b;
  }, [link, addresses, leaveOpen]);

  const { data: zapsData } = useRequestBuilder<FlatNoteStore>(
    System,
    FlatNoteStore,
    zapsSub
  );
  const zaps = (zapsData ?? [])
    .map((ev) => parseZap(ev, System.ProfileLoader.Cache))
    .filter((z) => z && z.valid && z.receiver === link.id);

  return {
    streams,
    zaps,
  };
}
