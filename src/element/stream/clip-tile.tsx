import { findTag, profileLink } from "@/utils";
import { NostrEvent } from "@snort/system";
import { useUserProfile } from "@snort/system-react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";
import { getName } from "../profile";

export function ClipTile({ ev }: { ev: NostrEvent }) {
  const profile = useUserProfile(ev.pubkey);
  const r = findTag(ev, "r");
  const title = findTag(ev, "title");
  return (
    <div className="h-full flex flex-col gap-4 bg-layer-1 rounded-xl px-3 py-2">
      <span>
        <FormattedMessage
          defaultMessage="Clip by {name}"
          values={{
            name: (
              <Link to={profileLink(profile, ev.pubkey)} className="font-medium text-primary">
                {getName(ev.pubkey, profile)}
              </Link>
            ),
          }}
        />
      </span>
      <video src={r} controls />
      {title}
    </div>
  );
}
