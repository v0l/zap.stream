import { OLD_SHORTS_KIND, OLD_VIDEO_KIND, SHORTS_KIND, VIDEO_KIND } from "@/const"
import { type MediaPayload, VideoInfo } from "@/service/video/info"
import { findTag } from "@/utils"
import type { NostrEvent, TaggedNostrEvent } from "@snort/system"
import { useEffect, useState } from "react"

const DEAD_LINK_TTL_MS = 10 * 60 * 1000

const saveDeadLink = (link: string, val: boolean) =>
  localStorage.setItem(`dead-link:${link}`, JSON.stringify({ alive: val, at: Date.now() }))

function getDeadLink(link: string): boolean | null {
  const raw = localStorage.getItem(`dead-link:${link}`)
  if (raw === null) return null
  try {
    const parsed = JSON.parse(raw) as { alive?: boolean; at?: number } | boolean
    if (typeof parsed !== "object" || parsed === null) return null
    if (typeof parsed.alive !== "boolean" || typeof parsed.at !== "number") return null
    if (!parsed.alive && Date.now() - parsed.at > DEAD_LINK_TTL_MS) return null
    return parsed.alive
  } catch {
    return null
  }
}

export function useDeadLink(ev: TaggedNostrEvent | NostrEvent) {
  const [alive, setAlive] = useState<MediaPayload>()

  async function testLink(link: string) {
    const u = new URL(link)
    link = u.toString() // normalize link
    const existing = getDeadLink(link)
    if (existing === null) {
      // youtube links cant be played
      if (u.hostname.endsWith("youtube.com") || u.hostname.endsWith("youtu.be")) {
        saveDeadLink(link, false)
        return false
      }
      let ok = false
      try {
        const req = await fetch(link, {
          method: "HEAD",
        })
        ok = req.ok
      } catch {
        ok = false
      }
      saveDeadLink(link, ok)
      return ok
    } else {
      return existing
    }
  }

  async function testPayload(pl: MediaPayload) {
    const alive = await testLink(pl.url)
    if (pl.url && alive) {
      return pl
    }
    for (const alt of pl.alternatives) {
      const alive = await testLink(alt)
      if (alt && alive) {
        return {
          ...pl,
          url: alt,
        }
      }
    }
  }

  async function getLiveLink(links: Array<MediaPayload>, isStale: () => boolean) {
    for (const l of links) {
      const live = await testPayload(l)
      if (isStale()) return
      if (live) {
        setAlive(live)
        break
      }
    }
  }

  useEffect(() => {
    const links =
      ev.kind === VIDEO_KIND || ev.kind === SHORTS_KIND || ev.kind === OLD_SHORTS_KIND || ev.kind === OLD_VIDEO_KIND
        ? VideoInfo.parse(ev)?.sources()
        : [
            {
              url: findTag(ev, "streaming") ?? findTag(ev, "recording"),
              alternatives: [],
            } as MediaPayload,
          ]

    let ignore = false
    getLiveLink(links, () => ignore).catch(console.error)
    return () => {
      ignore = true
    }
  }, [ev])

  return alive
}
