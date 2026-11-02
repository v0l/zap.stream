import { useParams } from "react-router"
import { tryParseNostrLink } from "@snort/system"
import { useMemo } from "react"
import { FormattedMessage } from "react-intl"

import { LiveChat } from "@/element/chat/live-chat"
import { StreamContextProvider } from "@/element/stream/stream-state"
import { ChatApis } from "@/service/chat/types"

export function ChatPopout() {
  const params = useParams()
  const link = params.id ? tryParseNostrLink(params.id) : undefined
  const hash = window.location.hash
  const { chat, badges } = useMemo(() => {
    const hashParams = new URLSearchParams(hash !== "" ? hash.substring(1) : undefined)
    for (const k of Object.keys(ChatApis)) {
      const kParam = hashParams.get(k)
      if (kParam) {
        try {
          ChatApis[k as "twitch" | "youtube" | "kick"].loadFromWidgetParams(kParam)
        } catch (error) {
          console.error("Failed to load widget params for", k, error)
        }
      }
    }
    return { chat: hashParams.get("chat") === "true", badges: hashParams.get("badges") === "true" }
  }, [hash])

  if (!link) {
    return (
      <p className="p-4">
        <FormattedMessage defaultMessage="This chat link is not valid." />
      </p>
    )
  }
  return (
    <div className="h-[calc(100vh-1rem)] w-screen px-2 my-2">
      <StreamContextProvider link={link}>
        <LiveChat canWrite={chat} showScrollbar={false} className="h-inherit" autoRaid={false} showBadges={badges} />
      </StreamContextProvider>
    </div>
  )
}
