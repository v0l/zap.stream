import { useCategoryZaps } from "@/hooks/category-zaps";
import { formatSatsCompact } from "@/number";
import { getName } from "../profile";
import { Avatar } from "../avatar";
import { useUserProfile } from "@snort/system-react";
import { Icon } from "../icon";
import { FormattedMessage } from "react-intl";
import { profileLink } from "@/utils";
import { Link } from "react-router-dom";

export function CategoryTopZapsStreamer({ gameId }: { gameId: string }) {
  const zaps = useCategoryZaps(gameId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 items-center">
        <Icon name="zap-filled" className="text-zap" size={24} />
        <div className="text-neutral-500 font-medium">
          <FormattedMessage defaultMessage="Most Zapped Streamers" />
        </div>
      </div>
      <div className="w-[calc(100dvw-2rem)] overflow-x-scroll scrollbar-hidden min-w-0">
        <div className="flex gap-4">
          {Object.entries(zaps.topPubkeys)
            .sort(([, a], [, b]) => (a > b ? -1 : 1))
            .slice(0, 4)
            .map(([pubkey, amount]) => (
              <TopStreamer pubkey={pubkey} amount={amount} key={pubkey} />
            ))}
        </div>
      </div>
    </div>
  );
}

function TopStreamer({ pubkey, amount }: { pubkey: string; amount: number }) {
  const profile = useUserProfile(pubkey);
  return (
    <div key={pubkey} className="flex gap-2">
      <Link to={profileLink(profile, pubkey)}>
        <Avatar pubkey={pubkey} user={profile} size={56} />
      </Link>

      <div className="flex flex-col">
        <div className="text-zap text-xl font-medium">{formatSatsCompact(amount)}</div>
        <div className="whitespace-nowrap">
          <Link to={profileLink(profile, pubkey)} className="hover:underline">
            {getName(pubkey, profile)}
          </Link>
        </div>
      </div>
    </div>
  );
}
