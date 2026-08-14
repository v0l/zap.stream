import { describe, expect, it } from "bun:test"
import { parseYouTubeUrl, youtubeThumbnailUrl } from "./youtube"

const ID = "dQw4w9WgXcQ"

describe("parseYouTubeUrl", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", { id: ID }],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ", { id: ID }],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", { id: ID }],
    ["https://music.youtube.com/watch?v=dQw4w9WgXcQ", { id: ID }],
    ["https://gaming.youtube.com/watch?v=dQw4w9WgXcQ", { id: ID }],
    ["https://youtu.be/dQw4w9WgXcQ", { id: ID }],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", { id: ID }],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", { id: ID }],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", { id: ID }],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", { id: ID }],
    ["https://www.youtube.com/v/dQw4w9WgXcQ", { id: ID }],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123", { id: ID }],
  ])("parses %s", (url, expected) => {
    expect(parseYouTubeUrl(url)).toEqual({ start: undefined, ...expected })
  })

  it.each([
    ["https://youtu.be/dQw4w9WgXcQ?t=42", 42],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s", 42],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1h2m3s", 3723],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=2m", 120],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ?start=90", 90],
    // fractional seconds must be floored, YouTube's start param is an integer
    ["https://youtu.be/dQw4w9WgXcQ?t=90.7", 90],
  ])("parses start offset in %s", (url, start) => {
    expect(parseYouTubeUrl(url)?.start).toBe(start)
  })

  it.each([
    ["https://youtu.be/dQw4w9WgXcQ?t=0", undefined],
    ["https://youtu.be/dQw4w9WgXcQ?t=", undefined],
    ["https://youtu.be/dQw4w9WgXcQ?t=abc", undefined],
    ["https://youtu.be/dQw4w9WgXcQ?t=-5", undefined],
  ])("ignores non-positive/invalid offset in %s", (url, start) => {
    expect(parseYouTubeUrl(url)?.start).toBe(start as undefined)
  })

  it.each([
    "https://example.com/watch?v=dQw4w9WgXcQ",
    "https://notyoutube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com.evil.tld/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=tooshort",
    "https://www.youtube.com/watch?v=way_too_long_id_here",
    "https://www.youtube.com/feed/subscriptions",
    "https://www.youtube.com/",
    "https://stream.example.com/live/index.m3u8",
    "moq://example.com/stream",
    "not a url",
    "",
  ])("rejects %s", url => {
    expect(parseYouTubeUrl(url)).toBeUndefined()
  })
})

describe("youtubeThumbnailUrl", () => {
  it("returns a 16:9 thumbnail for YouTube links", () => {
    expect(youtubeThumbnailUrl(`https://youtu.be/${ID}`)).toBe(`https://i.ytimg.com/vi/${ID}/mqdefault.jpg`)
  })

  it("returns undefined for non-YouTube links", () => {
    expect(youtubeThumbnailUrl("https://example.com/rec.mp4")).toBeUndefined()
  })
})
