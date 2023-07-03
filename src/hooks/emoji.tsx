import {
  RequestBuilder,
  EventKind,
  ReplaceableNoteStore,
  ParameterizedReplaceableNoteStore,
} from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { System } from "index";
import { useMemo } from "react";
import { findTag } from "utils";
import type { EmojiTag } from "../element/emoji";

export interface EmojiPack {
  address: string;
  name: string;
  author: string;
  emojis: EmojiTag[];
}

export default function useEmoji(pubkey: string) {
  const sub = useMemo(() => {
    const rb = new RequestBuilder(`emoji:${pubkey}`);

    rb.withFilter()
      .authors([pubkey])
      .kinds([10030 as EventKind, 30030 as EventKind]);

    return rb;
  }, [pubkey]);

  const { data: userEmoji } = useRequestBuilder<ReplaceableNoteStore>(
    System,
    ReplaceableNoteStore,
    sub
  );

  const related = useMemo(() => {
    if (userEmoji) {
      return userEmoji.tags.filter(
        (t) => t.at(0) === "a" && t.at(1)?.startsWith(`30030:`)
      );
    }
    return [];
  }, [userEmoji]);

  const subRelated = useMemo(() => {
    const splitted = related.map((t) => t.at(1)!.split(":"));
    const authors = splitted
      .map((s) => s.at(1))
      .filter((s) => s)
      .map((s) => s as string);
    const identifiers = splitted
      .map((s) => s.at(2))
      .filter((s) => s)
      .map((s) => s as string);

    const rb = new RequestBuilder(`emoji-related:${pubkey}`);

    rb.withFilter()
      .kinds([30030 as EventKind])
      .authors(authors)
      // @ts-expect-error
      .tag(["d", identifiers]);

    return rb;
  }, [pubkey, related]);

  const { data: relatedData } =
    useRequestBuilder<ParameterizedReplaceableNoteStore>(
      System,
      ParameterizedReplaceableNoteStore,
      subRelated
    );
  const emojiPacks = useMemo(() => {
    return relatedData ?? [];
  }, [relatedData]);

  const emojis = useMemo(() => {
    return emojiPacks.map((ev) => {
      const d = findTag(ev, "d");
      return {
        address: `${ev.kind}:${ev.pubkey}:${d}`,
        name: d,
        author: ev.pubkey,
        emojis: ev.tags.filter((t) => t.at(0) === "emoji") as EmojiTag[],
      } as EmojiPack;
    });
  }, [userEmoji, emojiPacks]);

  return emojis;
}
