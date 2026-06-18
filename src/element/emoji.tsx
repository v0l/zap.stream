import { useMemo } from "react"
import type { EmojiTag } from "@/types"

export type EmojiProps = {
  name: string
  url: string
}

export function Emoji({ name, url }: EmojiProps) {
  return <img alt={name} title={name} src={url} className="w-[24px] h-[24px] inline" />
}

export function Emojify({ content, emoji }: { content: string; emoji: EmojiTag[] }) {
  const emojified = useMemo(() => {
    let offset = 0
    return content.split(/:(\w+):/g).map(i => {
      const key = offset
      offset += i.length
      const t = emoji.find(t => t[1] === i)
      if (t) {
        return <Emoji key={`emoji-${key}`} name={t[1]} url={t[2]} />
      } else {
        return i
      }
    })
  }, [content, emoji])
  return <>{emojified}</>
}
