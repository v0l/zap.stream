import { NostrLink, TaggedNostrEvent } from "@snort/system";
import { Profile } from "../profile";
import { FormattedMessage } from "react-intl";
import { extractStreamInfo, findTag } from "@/utils";
import { useEventFeed } from "@snort/system-react";
import EventReactions from "../event-reactions";
import { Link } from "react-router-dom";

export default function LiveStreamClip({ ev }: { ev: TaggedNostrEvent }) {
  const src = findTag(ev, "r");
  const streamTag = NostrLink.fromTags(ev.tags)?.[0];

  const streamEvent = useEventFeed(streamTag);
  const { title } = extractStreamInfo(streamEvent);
  return (
    <>
      <h1 className="mb-2">
        <FormattedMessage
          defaultMessage="Clip from {title}"
          values={{
            title: (
              <Link className="text-primary" to={`/${streamTag?.encode()}`}>
                {title}
              </Link>
            ),
          }}
        />
      </h1>
      <div className="rounded-xl px-4 py-3 flex flex-col gap-2 border border-layer-1">
        {ev.content && <h2>{ev.content}</h2>}
        <Profile pubkey={ev.pubkey} avatarSize={40} />
        <video src={src} controls />
        <EventReactions ev={ev} />
      </div>
    </>
  );
}
