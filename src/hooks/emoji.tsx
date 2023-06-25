import { RequestBuilder, EventKind, FlatNoteStore } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { System } from "index";
import { useMemo } from "react";
import type { EmojiTag } from "../element/emoji";

export default function useEmoji(pubkey: string) {
  const sub = useMemo(() => {
    const rb = new RequestBuilder(`emoji:${pubkey}`);

    rb.withFilter()
      .authors([pubkey])
      .kinds([10030 as EventKind, 30030 as EventKind]);

    return rb;
  }, [pubkey]);

  const { data } = useRequestBuilder<FlatNoteStore>(System, FlatNoteStore, sub);
  const userEmoji = useMemo(() => {
    return data ?? [];
  }, [data]);

  const related = useMemo(() => {
    if (userEmoji) {
      const tags = userEmoji.at(0)?.tags ?? [];
      return tags.filter(
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

  const { data: relatedData } = useRequestBuilder<FlatNoteStore>(
    System,
    FlatNoteStore,
    subRelated
  );
  const emojiPacks = useMemo(() => {
    return relatedData ?? [];
  }, [relatedData]);

  const emojis = useMemo(() => {
    return userEmoji
      .concat(emojiPacks)
      .map((ev) => {
        return ev.tags.filter((t) => t.at(0) === "emoji");
      })
      .flat() as EmojiTag[];
  }, [userEmoji, emojiPacks]);

  return emojis;
}
