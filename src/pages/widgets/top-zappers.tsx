import { NostrLink } from "@snort/system"
import { FormattedMessage } from "react-intl"

import { Icon } from "@/element/icon"
import { TopZappers } from "@/element/top-zappers"
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed"
import { useZaps } from "@/hooks/zaps"
import { OverlayCard } from "./overlay-card"

export function TopZappersWidget({ link }: { link: NostrLink }) {
  const currentEvent = useCurrentStreamFeed(link, true)
  const zaps = useZaps(currentEvent ? NostrLink.fromEvent(currentEvent) : undefined, true)
  return (
    <OverlayCard className="flex-wrap items-center gap-x-4 gap-y-2">
      <span className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-layer-4">
        <Icon name="zap-filled" size={14} className="text-zap" />
        <FormattedMessage defaultMessage="Top Zappers" />
      </span>
      {zaps.length === 0 ? (
        <span className="text-layer-4">
          <FormattedMessage defaultMessage="No zaps yet" />
        </span>
      ) : (
        <div className="flex flex-wrap gap-2">
          <TopZappers
            zaps={zaps}
            limit={3}
            avatarSize={24}
            showName={true}
            className="gap-3 rounded-full bg-layer-2 pl-1 pr-3 py-1 tabular-nums"
          />
        </div>
      )}
    </OverlayCard>
  )
}
