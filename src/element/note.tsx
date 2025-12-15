import { NostrLink, type TaggedNostrEvent } from "@snort/system";

import { Profile } from "./profile";
import EventReactions from "./event-reactions";
import { Text } from "@/element/text";
import { Link } from "react-router";
import { Icon } from "./icon";

export function Note({ ev }: { ev: TaggedNostrEvent }) {
  return (
    <div className="bg-layer-2 rounded-xl px-4 py-3 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <Profile pubkey={ev.pubkey} avatarSize={30} />
        <Link to={`/${NostrLink.fromEvent(ev).encode()}`}>
          <Icon name="link" size={24} />
        </Link>
      </div>
      <Text tags={ev.tags} content={ev.content} className="whitespace-pre-line overflow-wrap" />
      <EventReactions ev={ev} />
    </div>
  );
}
