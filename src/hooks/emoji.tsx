import { useMemo } from "react";
import uniqBy from "lodash.uniqby";

import {
  RequestBuilder,
  ReplaceableNoteStore,
  NoteCollection,
  NostrEvent,
} from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { System } from "index";
import { findTag } from "utils";
import { EMOJI_PACK, USER_EMOJIS } from "const";
import { EmojiPack } from "types";

function cleanShortcode(shortcode?: string) {
  return shortcode?.replace(/\s+/g, "_").replace(/_$/, "");
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

export function useUserEmojiPacks(
  pubkey?: string,
  userEmoji: { tags: string[][] },
) {
  const related = useMemo(() => {
    if (userEmoji) {
      return userEmoji.tags.filter(
        (t) => t.at(0) === "a" && t.at(1)?.startsWith(`${EMOJI_PACK}:`),
      );
    }
    return [];
  }, [userEmoji]);

  const subRelated = useMemo(() => {
    if (!pubkey) return null;
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

    rb.withFilter().kinds([EMOJI_PACK]).authors(authors).tag("d", identifiers);

    rb.withFilter().kinds([EMOJI_PACK]).authors([pubkey]);

    return rb;
  }, [pubkey, related]);

  const { data: relatedData } = useRequestBuilder<NoteCollection>(
    System,
    NoteCollection,
    subRelated,
  );

  const emojiPacks = useMemo(() => {
    return relatedData ?? [];
  }, [relatedData]);

  const emojis = useMemo(() => {
    return uniqBy(emojiPacks.map(toEmojiPack), packId);
  }, [emojiPacks]);

  return emojis;
}

export default function useEmoji(pubkey?: string) {
  const sub = useMemo(() => {
    if (!pubkey) return null;
    const rb = new RequestBuilder(`emoji:${pubkey}`);

    rb.withFilter().authors([pubkey]).kinds([USER_EMOJIS]);

    return rb;
  }, [pubkey]);

  const { data: userEmoji } = useRequestBuilder<ReplaceableNoteStore>(
    System,
    ReplaceableNoteStore,
    sub,
  );

  const emojis = useUserEmojiPacks(pubkey, userEmoji ?? { tags: [] });
  return emojis;
}
