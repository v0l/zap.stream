import { type NostrLink } from "@snort/system";

import { useEvent } from "hooks/event";
import { EMOJI_PACK } from "const";
import { EmojiPack } from "element/emoji-pack";

interface AddressProps {
  link: NostrLink;
}

export function Address({ link }: AddressProps) {
  const event = useEvent(link);

  if (event?.kind === EMOJI_PACK) {
    return <EmojiPack ev={event} />;
  }

  return null;
}
