import { NostrLink } from "@snort/system"
import { useUserProfile } from "@snort/system-react"
import { FormattedMessage } from "react-intl"

import { Avatar } from "@/element/avatar"
import { Icon } from "@/element/icon"
import { getName } from "@/element/profile-name"
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed"
import useTopZappers from "@/hooks/top-zappers"
import { useZaps } from "@/hooks/zaps"
import { formatSats } from "@/number"
import { OverlayCard } from "./overlay-card"

function Zapper({ pubkey, total }: { pubkey: string; total: number }) {
  const anon = pubkey === "anon"
  const profile = useUserProfile(anon ? undefined : pubkey)
  return (
    <span className="flex items-center gap-2 rounded-full bg-layer-2 pl-1 pr-3 py-1 tabular-nums">
      <Avatar pubkey={pubkey} user={profile} size={24} />
      <span>{anon ? <FormattedMessage defaultMessage="Anon" id="bfvyfs" /> : getName(pubkey, profile)}</span>
      <span className="flex items-center gap-1">
        <Icon name="zap-filled" className="text-zap" size={14} />
        {formatSats(total)}
      </span>
    </span>
  )
}

export function TopZappersWidget({ link }: { link: NostrLink }) {
  const currentEvent = useCurrentStreamFeed(link, true)
  const zaps = useZaps(currentEvent ? NostrLink.fromEvent(currentEvent) : undefined, true)
  const top = useTopZappers(zaps).slice(0, 3)
  return (
    <OverlayCard className="flex-wrap items-center gap-x-4 gap-y-2">
      <span className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-layer-4">
        <Icon name="zap-filled" size={14} className="text-zap" />
        <FormattedMessage defaultMessage="Top Zappers" />
      </span>
      {top.length === 0 ? (
        <span className="text-layer-4">
          <FormattedMessage defaultMessage="No zaps yet" />
        </span>
      ) : (
        <div className="flex flex-wrap gap-2">
          {top.map(z => (
            <Zapper key={z.pubkey} pubkey={z.pubkey} total={z.total} />
          ))}
        </div>
      )}
    </OverlayCard>
  )
}
