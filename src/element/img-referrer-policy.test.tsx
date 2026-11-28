import type { HTMLProps } from "react"
import "@/test/dom"
import { describe, expect, it } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { Avatar } from "./avatar"
import { Emoji } from "./emoji"
import Markdown from "./markdown"
import YouTubePlayer from "./stream/youtube-player"

const TEST_PUBKEY = "a".repeat(64)

describe("untrusted image referrerPolicy", () => {
  it("sets referrerpolicy=no-referrer on avatar images and locks out caller overrides", () => {
    // AvatarProps is HTMLProps<HTMLImageElement>-based, which (in @types/react
    // 19.2) has no referrerPolicy — so a typed caller can't even pass it. The
    // cast simulates an untyped caller (plain JS / future types change) to
    // prove the runtime lock after {...props} holds anyway.
    const callerProps = { referrerPolicy: "unsafe-url" } as unknown as HTMLProps<HTMLImageElement>
    const html = renderToStaticMarkup(
      <Avatar {...callerProps} pubkey={TEST_PUBKEY} user={{ picture: "https://cdn.example/avatar.png" }} />,
    )
    expect(html).toContain("<img")
    expect(html).toContain("cdn.example/avatar.png")
    const lower = html.toLowerCase()
    expect(lower).toContain('referrerpolicy="no-referrer"')
    expect(lower).not.toContain('referrerpolicy="unsafe-url"')
  })

  it("sets referrerpolicy=no-referrer on custom emoji images", () => {
    const html = renderToStaticMarkup(<Emoji name="zap" url="https://cdn.example/emoji/zap.png" />)
    expect(html).toContain("<img")
    expect(html.toLowerCase()).toContain('referrerpolicy="no-referrer"')
    expect(html).toContain("cdn.example/emoji/zap.png")
  })

  it("sets referrerpolicy=no-referrer on markdown image tokens", () => {
    const html = renderToStaticMarkup(<Markdown content="![banner](https://cdn.example/banner.png)" />)
    expect(html).toContain("<img")
    expect(html.toLowerCase()).toContain('referrerpolicy="no-referrer"')
    expect(html).toContain("cdn.example/banner.png")
  })

  it("preserves strict-origin-when-cross-origin on YouTube embeds", () => {
    const html = renderToStaticMarkup(<YouTubePlayer video={{ id: "dQw4w9WgXcQ" }} />)
    expect(html).toContain("<iframe")
    const lower = html.toLowerCase()
    expect(lower).toContain('referrerpolicy="strict-origin-when-cross-origin"')
    expect(lower).not.toContain('referrerpolicy="no-referrer"')
  })
})
