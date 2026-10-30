import { MuteButton } from "@/element/mute-button"
import { Profile } from "@/element/profile"
import { dedupe } from "@snort/shared"
import { useMemo } from "react"
import { FormattedMessage } from "react-intl"
import { useStream } from "@/element/stream/stream-state"

export function DashboardChatList() {
  const { feed } = useStream()
  const pubkeys = useMemo(() => {
    return dedupe(feed.map(a => a.pubkey))
  }, [feed])

  if (pubkeys.length === 0) {
    return (
      <p className="px-4 py-4 text-sm text-layer-4">
        <FormattedMessage defaultMessage="Nobody has chatted yet." />
      </p>
    )
  }
  return pubkeys.map(a => (
    <div key={a} className="flex justify-between items-center gap-3 px-4 py-2 border-b border-layer-3 last:border-0">
      <Profile pubkey={a} avatarSize={28} className="min-w-0 truncate" />
      <MuteButton pubkey={a} />
    </div>
  ))
}
