import { Profile } from "@/element/profile"
import type { ParsedZap } from "@snort/system"
import { FormattedMessage, FormattedNumber } from "react-intl"
import { Text } from "@/element/text"

export function DashboardHighlightZap({ zap }: { zap: ParsedZap }) {
  return (
    <div className="px-4 py-4 bg-primary/10 border border-primary/40 flex flex-col gap-2 rounded-xl">
      <div className="flex justify-between items-center gap-3 text-xl font-semibold">
        <Profile
          pubkey={zap.sender ?? "anon"}
          options={{
            showAvatar: false,
          }}
        />
        <span className="text-primary tabular-nums shrink-0">
          <FormattedMessage
            defaultMessage="{n} sats"
            id="CsCUYo"
            values={{
              n: <FormattedNumber value={zap.amount} />,
            }}
          />
        </span>
      </div>
      {zap.content && (
        <div className="text-lg text-layer-5">
          <Text content={zap.content} tags={[]} />
        </div>
      )}
    </div>
  )
}
