import type { NostrLink, TaggedNostrEvent } from "@snort/system"
import { unixNow } from "@snort/shared"
import { FormattedMessage } from "react-intl"

import { Icon } from "@/element/icon"
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed"
import { useStatus } from "@/hooks/status"
import { findTag, getHost } from "@/event-tags"
import { OverlayCard } from "./overlay-card"

export function Music({ link }: { link: NostrLink }) {
  const currentEvent = useCurrentStreamFeed(link, true)
  if (!currentEvent) return
  return <MusicWidget ev={currentEvent} />
}

function MusicWidget({ ev }: { ev: TaggedNostrEvent }) {
  const host = getHost(ev)
  const nowPlaying = useStatus("music", host, true)
  if (!nowPlaying) return
  const cover = findTag(nowPlaying, "cover")
  const expiry = findTag(nowPlaying, "expiration")
  if (expiry && Number(expiry) < unixNow()) return
  return (
    <OverlayCard className="items-center gap-3 max-w-[420px] pl-2 py-2">
      {cover ? (
        <img className="w-14 h-14 shrink-0 rounded-xl object-cover" src={cover} alt="" />
      ) : (
        <span className="w-14 h-14 shrink-0 rounded-xl bg-layer-2 flex items-center justify-center text-primary">
          <Icon name="music" size={24} />
        </span>
      )}
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          <FormattedMessage defaultMessage="Now playing" />
        </span>
        <span className="truncate">{nowPlaying.content}</span>
      </div>
    </OverlayCard>
  )
}
