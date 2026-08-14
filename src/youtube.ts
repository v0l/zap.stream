export interface YouTubeLink {
  id: string
  /** Start offset in seconds (from t=/start= params) */
  start?: number
}

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/

function parseYouTubeTime(v?: string | null): number | undefined {
  if (!v) return undefined
  const n = Number(v)
  if (!Number.isNaN(n) && n > 0) return Math.floor(n)
  // e.g. 1h2m3s
  const m = v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i)
  if (!m) return undefined
  const total = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
  return total > 0 ? total : undefined
}

/**
 * Parse a YouTube link (watch, shorts, live, embed, youtu.be, music/gaming.youtube.com,
 * youtube-nocookie.com) into a video id with an optional start offset.
 * Returns undefined for non-YouTube URLs.
 */
export function parseYouTubeUrl(url: string): YouTubeLink | undefined {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^(www|m|music|gaming)\./, "")
    if (host !== "youtube.com" && host !== "youtu.be" && host !== "youtube-nocookie.com") return undefined

    let id = ""
    if (host === "youtu.be") {
      id = u.pathname.split("/").filter(Boolean)[0] ?? ""
    } else {
      const v = u.searchParams.get("v")
      if (v) {
        id = v
      } else {
        const parts = u.pathname.split("/").filter(Boolean)
        if (parts.length >= 2 && ["watch", "shorts", "live", "embed", "v"].includes(parts[0])) {
          id = parts[1]
        }
      }
    }
    if (!YOUTUBE_ID_RE.test(id)) return undefined

    return { id, start: parseYouTubeTime(u.searchParams.get("t") ?? u.searchParams.get("start")) }
  } catch {
    return undefined
  }
}

/**
 * Thumbnail for a YouTube link, for use where a video file can't be displayed as an image.
 * `mqdefault` is 16:9 (unlike `hqdefault`, which is letterboxed into 4:3).
 */
export function youtubeThumbnailUrl(url: string): string | undefined {
  const yt = parseYouTubeUrl(url)
  return yt ? `https://i.ytimg.com/vi/${yt.id}/mqdefault.jpg` : undefined
}
