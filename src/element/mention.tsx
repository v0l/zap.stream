import { Link } from "react-router";
import { useUserProfile } from "@snort/system-react";
import { profileLink } from "@/utils";
import { NostrPrefix } from "@snort/shared";
import type { NostrLink } from "@snort/system";

export function Mention({ link }: { link: NostrLink }) {
  const encoded = link.encode();
  if (link.type === NostrPrefix.PublicKey || link.type === NostrPrefix.Profile) {
    const user = useUserProfile(link.id);
    return (
      <Link to={profileLink(user, link)} className="text-primary">
        {user?.name || encoded.slice(0, 12)}
      </Link>
    );
  } else {
    return <Link to={`/${encoded}`}>{encoded.slice(0, 12)}</Link>;
  }
}
