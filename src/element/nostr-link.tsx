import { NostrPrefix, tryParseNostrLink } from "@snort/system";
import { Mention } from "./mention";

export function NostrLink({ link }: { link: string }) {
  const nav = tryParseNostrLink(link);
  if (
    nav?.type === NostrPrefix.PublicKey ||
    nav?.type === NostrPrefix.Profile
  ) {
    return <Mention pubkey={nav.id} relays={nav.relays} />;
  } else {
    <a href={link} target="_blank" rel="noreferrer" className="ext">
      {link}
    </a>;
  }
}
