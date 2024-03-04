import { useMemo } from "react";
import { EmojiTag } from "@/types";

export type EmojiProps = {
  name: string;
  url: string;
};

export function Emoji({ name, url }: EmojiProps) {
  return <img alt={name} title={name} src={url} className="w-[24px] h-[24px] inline" />;
}

export function Emojify({ content, emoji }: { content: string; emoji: EmojiTag[] }) {
  const emojified = useMemo(() => {
    return content.split(/:(\w+):/g).map(i => {
      const t = emoji.find(t => t[1] === i);
      if (t) {
        return <Emoji name={t[1]} url={t[2]} />;
      } else {
        return i;
      }
    });
  }, [content, emoji]);
  return <>{emojified}</>;
}
