import "./event.css";

import { type NostrLink, EventKind } from "@snort/system";
import { useEvent } from "hooks/event";
import { GOAL } from "const";
import { Goal } from "element/goal";
import { Note } from "element/note";

interface EventProps {
  link: NostrLink;
}

export function Event({ link }: EventProps) {
  const event = useEvent(link);

  if (event?.kind === GOAL) {
    return (
      <div className="event-container">
        <Goal ev={event} />
      </div>
    );
  }

  if (event?.kind === EventKind.TextNote) {
    return (
      <div className="event-container">
        <Note ev={event} />
      </div>
    );
  }

  return null;
}
