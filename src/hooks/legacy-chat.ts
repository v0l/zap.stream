import { ChatApis, type ExternalChatFeed, type ExternalChatEvent, type ExternalChatBadge } from "@/service/chat/types"
import { useEffect, useState } from "react"

type FeedName = "twitch" | "youtube" | "kick"

export function useLegacyChatFeed(props: { enable?: boolean } | undefined) {
  const enable = props?.enable ?? false
  const [feeds, setFeeds] = useState<Partial<Record<FeedName, ExternalChatFeed>>>({})
  const [events, setEvents] = useState<Array<ExternalChatEvent>>([])
  const [badges, setBadges] = useState<Array<ExternalChatBadge>>([])

  useEffect(() => {
    if (!enable) return
    let active = true
    const opened: Array<ExternalChatFeed> = []
    for (const name of ["twitch", "youtube", "kick"] as const) {
      const api = ChatApis[name]
      if (!api.isAuthed()) continue
      const feed = api.getFeed()
      opened.push(feed)
      feed.on("chat", e => {
        if (active) setEvents(v => [...v, e])
      })
      feed
        .connectFeed()
        .then(async () => {
          const b = await feed.getBadges()
          if (!active) return
          setBadges(x => [...x, ...b])
          setFeeds(x => ({ ...x, [name]: feed }))
        })
        .catch(console.error)
    }
    return () => {
      active = false
      for (const feed of opened) {
        feed.removeAllListeners()
        feed.disconnect().catch(console.error)
      }
      setFeeds({})
    }
  }, [enable])

  return {
    events,
    badges,
    twitch: feeds.twitch,
    youtube: feeds.youtube,
    kick: feeds.kick,
  }
}
