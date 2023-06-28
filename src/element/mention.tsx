import { useUserProfile } from "@snort/system-react";
import { System } from "index";

interface MentionProps {
  pubkey: string;
  relays?: string[];
}

export function Mention({ pubkey, relays }: MentionProps) {
  const user = useUserProfile(System, pubkey);
  return (
    <a
      href={`https://snort.social/p/${pubkey}`}
      target="_blank"
      rel="noreferrer"
    >
      {user?.name || pubkey}
    </a>
  );
}
