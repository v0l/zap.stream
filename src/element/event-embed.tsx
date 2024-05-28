import { EventKind, TaggedNostrEvent, NostrLink } from "@snort/system";

import { Icon } from "./icon";
import { Goal } from "./goal";
import { Note } from "./note";
import { EmojiPack } from "./emoji-pack";
import { Badge } from "./badge";
import { EMOJI_PACK, GOAL, LIVE_STREAM_CLIP, StreamState } from "@/const";
import { useEventFeed } from "@snort/system-react";
import LiveStreamClip from "./stream/clip";
import { ExternalLink } from "./external-link";
import { extractStreamInfo } from "@/utils";
import LiveVideoPlayer from "./stream/live-video-player";
import { HTMLProps } from "react";

interface EventProps {
  link: NostrLink;
}

export function EventIcon({ kind }: { kind?: EventKind }) {
  switch (kind) {
    case GOAL:
      return <Icon name="piggybank" />;
    case EMOJI_PACK:
      return <Icon name="face-content" />;
    case EventKind.Badge:
      return <Icon name="badge" />;
    case EventKind.TextNote:
      return <Icon name="note" />;
  }
}

export function NostrEvent({ ev }: { ev: TaggedNostrEvent }) {
  switch (ev.kind) {
    case GOAL: {
      return <Goal ev={ev} />;
    }
    case EMOJI_PACK: {
      return <EmojiPack ev={ev} />;
    }
    case EventKind.Badge: {
      return <Badge ev={ev} />;
    }
    case EventKind.TextNote: {
      return <Note ev={ev} />;
    }
    case LIVE_STREAM_CLIP: {
      return <LiveStreamClip ev={ev} />;
    }
    case EventKind.LiveEvent: {
      const info = extractStreamInfo(ev);
      return (
        <LiveVideoPlayer
          title={info.title}
          status={info.status}
          stream={info.status === StreamState.Live ? info.stream : info.recording}
          poster={info.image}
        />
      );
    }
    default: {
      const link = NostrLink.fromEvent(ev);
      return <ExternalLink href={`https://snort.social/${link.encode()}`}>{link.encode()}</ExternalLink>;
    }
  }
}

export function EventEmbed({ link, ...props }: EventProps & HTMLProps<HTMLDivElement>) {
  const event = useEventFeed(link);
  if (event) {
    return <NostrEvent ev={event} {...props} />;
  }
}
