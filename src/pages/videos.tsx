import { OLD_VIDEO_KIND, VIDEO_KIND } from "@/const"
import VideoGrid from "@/element/video-grid"
import { findTag, getHost } from "@/utils"
import { RequestBuilder } from "@snort/system"
import { useRequestBuilder } from "@snort/system-react"
import { FormattedMessage } from "react-intl"
import { VideoTile } from "@/element/video/video-tile"
import { useFollows, useMutedPubkeys } from "@/hooks/login"
import { useMemo, useState } from "react"
import { Layer1Button } from "@/element/buttons"

export function VideosPage() {
  const follows = useFollows()
  const muted = useMutedPubkeys()
  const [tab, setTab] = useState<"all" | "subscriptions">("subscriptions")

  const rb = useMemo(() => {
    const rb = new RequestBuilder("videos")
    rb.withFilter().kinds([VIDEO_KIND, OLD_VIDEO_KIND]).limit(100)
    return rb
  }, [])

  const videos = useRequestBuilder(rb)

  const sorted = videos
    .filter(a => {
      const host = getHost(a)
      return !muted.has(host)
    })
    .sort((a, b) => {
      const pubA = findTag(a, "published_at") ?? a.created_at
      const pubB = findTag(b, "published_at") ?? b.created_at
      return Number(pubA) > Number(pubB) ? -1 : 1
    })

  const subscriptionVideos = sorted.filter(a => {
    const host = getHost(a)
    return follows.has(host)
  })

  const displayVideos = tab === "subscriptions" ? subscriptionVideos : sorted

  return (
    <div className="p-4">
      <h2>
        <FormattedMessage defaultMessage="Latest Videos" />
      </h2>
      <br />
      <div className="flex gap-2 mb-4">
        <Layer1Button onClick={() => setTab("all")} className={tab === "all" ? "" : "opacity-50"}>
          <FormattedMessage defaultMessage="All" />
        </Layer1Button>
        <Layer1Button onClick={() => setTab("subscriptions")} className={tab === "subscriptions" ? "" : "opacity-50"}>
          <FormattedMessage defaultMessage="Subscriptions" />
        </Layer1Button>
      </div>
      <VideoGrid>
        {displayVideos.map(a => (
          <VideoTile ev={a} key={a.id} style="grid" />
        ))}
      </VideoGrid>
    </div>
  )
}
