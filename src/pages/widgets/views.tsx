import type { NostrLink } from "@snort/system"
import { FormattedMessage, FormattedNumber } from "react-intl"

import { useCurrentStreamFeed } from "@/hooks/current-stream-feed"
import { findTag } from "@/utils"
import { OverlayCard } from "./overlay-card"

export function Views({ link }: { link: NostrLink }) {
  const current = useCurrentStreamFeed(link, true)
  const n = Number(findTag(current, "current_participants"))
  return (
    <OverlayCard className="items-center gap-3">
      <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_0_4px_rgb(255_176_0/0.22)]" />
      {Number.isNaN(n) ? (
        <span className="text-layer-4">
          <FormattedMessage defaultMessage="No viewer data available" id="AukrPM" />
        </span>
      ) : (
        <FormattedMessage
          defaultMessage="{n} watching"
          values={{
            n: (
              <span className="font-display text-2xl font-extrabold tabular-nums">
                <FormattedNumber value={n} />
              </span>
            ),
          }}
        />
      )}
    </OverlayCard>
  )
}
