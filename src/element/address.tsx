import { type NostrLink, EventKind } from "@snort/system";

import { useEvent } from "hooks/event";
import { EMOJI_PACK } from "const";
import { EmojiPack } from "element/emoji-pack";
import { Badge } from "element/badge";

interface AddressProps {
  link: NostrLink;
}

export function Address({ link }: AddressProps) {
  const event = useEvent(link);

  if (event?.kind === EMOJI_PACK) {
    return <EmojiPack ev={event} />;
  }

  if (event?.kind === EventKind.Badge) {
    return <Badge ev={event} />;
  }

  return null;
}
