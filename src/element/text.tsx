import { useMemo } from "react";
import { TaggedRawEvent } from "@snort/system";
import { type EmojiTag, Emojify } from "./emoji";

export function Text({ ev }: { ev: TaggedRawEvent }) {
  const emojis = useMemo(() => {
    return ev.tags.filter((t) => t.at(0) === "emoji").map((t) => t as EmojiTag);
  }, [ev]);
  return (
    <span>
      <Emojify content={ev.content} emoji={emojis} />
    </span>
  );
}
