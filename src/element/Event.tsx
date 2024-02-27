import "./event.css";

import { EventKind, type NostrEvent as NostrEventType, type NostrLink } from "@snort/system";

import { Icon } from "./icon";
import { Goal } from "./goal";
import { Note } from "./note";
import { EmojiPack } from "./emoji-pack";
import { Badge } from "./badge";
import { EMOJI_PACK, GOAL } from "@/const";
import { useEventFeed } from "@snort/system-react";

interface EventProps {
  link: NostrLink;
}

export function EventIcon({ kind }: { kind?: EventKind }) {
  if (kind === GOAL) {
    return <Icon name="piggybank" />;
  }

  if (kind === EMOJI_PACK) {
    return <Icon name="face-content" />;
  }

  if (kind === EventKind.Badge) {
    return <Icon name="badge" />;
  }

  if (kind === EventKind.TextNote) {
    return <Icon name="note" />;
  }

  return null;
}

export function NostrEvent({ ev }: { ev: NostrEventType }) {
  if (ev?.kind === GOAL) {
    return (
      <div className="event-container">
        <Goal ev={ev} />
      </div>
    );
  }

  if (ev?.kind === EMOJI_PACK) {
    return (
      <div className="event-container">
        <EmojiPack ev={ev} />
      </div>
    );
  }

  if (ev?.kind === EventKind.Badge) {
    return (
      <div className="event-container">
        <Badge ev={ev} />
      </div>
    );
  }

  if (ev?.kind === EventKind.TextNote) {
    return (
      <div className="event-container">
        <Note ev={ev} />
      </div>
    );
  }

  return null;
}

export function Event({ link }: EventProps) {
  const event = useEventFeed(link);
  return event ? <NostrEvent ev={event} /> : null;
}
