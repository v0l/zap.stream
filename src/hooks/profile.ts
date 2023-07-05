import { useMemo } from "react";
import {
  RequestBuilder,
  FlatNoteStore,
  NoteCollection,
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

    b.withFilter().kinds([LIVE_STREAM]).tag("p", [link.id]);

    return b;
  }, [link, leaveOpen]);

  const { data: streamsData } =
    useRequestBuilder<NoteCollection>(
      System,
      NoteCollection,
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

  const sortedStreams = useMemo(() => {
    const sorted = [...streams];
    sorted.sort((a, b) => b.created_at - a.created_at);
    return sorted;
  }, [streams]);

  return {
    streams: sortedStreams,
    zaps,
  };
}
