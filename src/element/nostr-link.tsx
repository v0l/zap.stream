import { tryParseNostrLink } from "@snort/system";
import { Mention } from "./mention";
import { ExternalLink } from "./external-link";
import { NostrPrefix } from "@snort/shared";

export function NostrLink({ link }: { link: string }) {
  const nav = tryParseNostrLink(link);
  if (nav?.type === NostrPrefix.PublicKey || nav?.type === NostrPrefix.Profile) {
    return <Mention pubkey={nav.id} relays={nav.relays} />;
  } else {
    <ExternalLink href={link}>{link}</ExternalLink>;
  }
}
