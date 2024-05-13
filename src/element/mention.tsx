import { Link } from "react-router-dom";
import { useUserProfile } from "@snort/system-react";
import { profileLink } from "@/utils";

interface MentionProps {
  pubkey: string;
  relays?: string[];
}

export function Mention({ pubkey }: MentionProps) {
  const user = useUserProfile(pubkey);
  return (
    <Link to={profileLink(user, pubkey)} className="text-primary">
      {user?.name || pubkey}
    </Link>
  );
}
