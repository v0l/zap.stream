import { Link } from "react-router-dom";
import { useUserProfile } from "@snort/system-react";
import { System } from "index";
import { hexToBech32 } from "utils";

interface MentionProps {
  pubkey: string;
  relays?: string[];
}

export function Mention({ pubkey }: MentionProps) {
  const user = useUserProfile(System, pubkey);
  const npub = hexToBech32("npub", pubkey);
  return <Link to={`/p/${npub}`}>{user?.name || pubkey}</Link>;
}
