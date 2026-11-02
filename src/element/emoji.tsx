import { useMemo } from "react"
import { safeMediaUrl } from "@/utils"
import type { EmojiTag } from "@/types"

export type EmojiProps = {
  name: string
  url: string
}

export function Emoji({ name, url }: EmojiProps) {
  // Emoji URLs come from attacker-controlled event tags; this is the shared
  // sink for chat messages, reactions and Emojify, so gate it here.
  const src = safeMediaUrl(url)
  if (!src) return null
  return <img alt={name} title={name} src={src} className="w-[24px] h-[24px] inline" />
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
