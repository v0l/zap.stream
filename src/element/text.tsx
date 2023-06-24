import "./text.css";
import { useMemo } from "react";
import { TaggedRawEvent } from "@snort/system";

type Emoji = [string, string];

function replaceEmoji(content: string, emoji: Emoji[]) {
  return content.split(/:(\w+):/g).map((i) => {
    const t = emoji.find((a) => a[0] === i);
    if (t) {
      return <img alt={t[0]} src={t[1]} className="custom-emoji" />;
    } else {
      return i;
    }
  });
}

export function Text({ ev }: { ev: TaggedRawEvent }) {
  const emojis = useMemo(() => {
    return ev.tags
      .filter((t) => t.at(0) === "emoji")
      .map((t) => t.slice(1) as Emoji);
  }, [ev]);
  return <span>{replaceEmoji(ev.content, emojis)}</span>;
}
