import "./emoji.css";
import { useMemo } from "react";

export type EmojiProps = {
  name: string;
  url: string;
};

export function Emoji({ name, url }: EmojiProps) {
  return <img alt={name} src={url} className="emoji" />;
}

export type EmojiTag = ["emoji", string, string];

export function Emojify({
  content,
  emoji,
}: {
  content: string;
  emoji: EmojiTag[];
}) {
  const emojified = useMemo(() => {
    return content.split(/:(\w+):/g).map((i) => {
      const t = emoji.find((t) => t[1] === i);
      if (t) {
        return <Emoji name={t[1]} url={t[2]} />;
      } else {
        return i;
      }
    });
  }, [content, emoji]);
  return <>{emojified}</>;
}
