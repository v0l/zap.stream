import { Profile } from "@/element/profile";
import { ParsedZap } from "@snort/system";
import { FormattedMessage, FormattedNumber } from "react-intl";
import { Text } from "@/element/text";

export function DashboardHighlightZap({ zap }: { zap: ParsedZap }) {
  return (
    <div className="px-4 py-6 bg-layer-1 flex flex-col gap-4 rounded-xl animate-flash">
      <div className="flex justify-between items-center text-zap text-2xl font-semibold">
        <Profile
          pubkey={zap.sender ?? "anon"}
          options={{
            showAvatar: false,
          }}
        />
        <span>
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
        <div className="text-2xl">
          <Text content={zap.content} tags={[]} />
        </div>
      )}
    </div>
  );
}
