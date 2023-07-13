import {
  RequestBuilder,
  EventKind,
  ReplaceableNoteStore,
  NoteCollection,
  NostrEvent,
} from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { System } from "index";
import { useMemo } from "react";
import { findTag } from "utils";
import type { EmojiTag } from "../element/emoji";
import uniqBy from "lodash.uniqby";

export interface Emoji {
  native?: string;
  id?: string;
}

export interface EmojiPack {
  address: string;
  name: string;
  author: string;
  emojis: EmojiTag[];
}

function cleanShortcode(shortcode?: string) {
  return shortcode?.replace(/\s+/, "_");
}

function toEmojiPack(ev: NostrEvent): EmojiPack {
  const d = findTag(ev, "d") || "";
  return {
    address: `${ev.kind}:${ev.pubkey}:${d}`,
    name: d,
    author: ev.pubkey,
    emojis: ev.tags
      .filter((t) => t.at(0) === "emoji")
      .map((t) => ["emoji", cleanShortcode(t.at(1)), t.at(2)]) as EmojiTag[],
  };
}

export function packId(pack: EmojiPack): string {
  return `${pack.author}:${pack.name}`;
}

export default function useEmoji(pubkey: string) {
  const sub = useMemo(() => {
    const rb = new RequestBuilder(`emoji:${pubkey}`);

    rb.withFilter()
      .authors([pubkey])
      .kinds([10030 as EventKind]);

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
      .tag("d", identifiers);

    rb.withFilter()
      .kinds([30030 as EventKind])
      .authors([pubkey]);

    return rb;
  }, [pubkey, related]);

  const { data: relatedData } = useRequestBuilder<NoteCollection>(
    System,
    NoteCollection,
    subRelated
  );

  const emojiPacks = useMemo(() => {
    return relatedData ?? [];
  }, [relatedData]);

  const emojis = useMemo(() => {
    return uniqBy(emojiPacks.map(toEmojiPack), packId);
  }, [emojiPacks]);

  return emojis;
}
