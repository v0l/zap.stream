import { EventKind, TaggedNostrEvent, NostrLink } from "@snort/system";

import { Icon } from "./icon";
import { Goal } from "./goal";
import { Note } from "./note";
import { EmojiPack } from "./emoji-pack";
import { BadgeInfo } from "./badge";
import {
  GOAL,
  LIVE_STREAM_CLIP,
  N94_LIVE_STREAM,
  OLD_SHORTS_KIND,
  OLD_VIDEO_KIND,
  SHORTS_KIND,
  StreamState,
  VIDEO_KIND,
} from "@/const";
import { useEventFeed } from "@snort/system-react";
import LiveStreamClip from "./stream/clip";
import { ExternalLink } from "./external-link";
import { extractStreamInfo } from "@/utils";
import LiveVideoPlayer from "./stream/live-video-player";
import { HTMLProps, ReactNode } from "react";
import { ShortPage } from "@/pages/short";
import { VideoPage } from "@/pages/video";

interface EventProps {
  link: NostrLink;
}

export function EventIcon({ kind }: { kind?: EventKind }) {
  switch (kind) {
    case GOAL:
      return <Icon name="piggybank" />;
    case EventKind.EmojiSet:
      return <Icon name="face-content" />;
    case EventKind.Badge:
      return <Icon name="badge" />;
    case EventKind.TextNote:
      return <Icon name="note" />;
  }
}

export function NostrEvent({ ev }: { ev: TaggedNostrEvent }) {
  const link = NostrLink.fromEvent(ev);
  function modalPage(inner: ReactNode) {
    return <div className="rounded-2xl px-4 py-3">{inner}</div>;
  }

  switch (ev.kind) {
    case GOAL: {
      return modalPage(<Goal ev={ev} />);
    }
    case EventKind.EmojiSet: {
      return modalPage(<EmojiPack ev={ev} />);
    }
    case EventKind.Badge: {
      return modalPage(<BadgeInfo ev={ev} />);
    }
    case EventKind.TextNote: {
      return modalPage(<Note ev={ev} />);
    }
    case LIVE_STREAM_CLIP: {
      return modalPage(<LiveStreamClip ev={ev} />);
    }
    case OLD_SHORTS_KIND:
    case SHORTS_KIND: {
      return <ShortPage link={link} evPreload={ev} />;
    }
    case OLD_VIDEO_KIND:
    case VIDEO_KIND: {
      return <VideoPage link={link} evPreload={ev} />;
    }
    case N94_LIVE_STREAM:
    case EventKind.LiveEvent: {
      const info = extractStreamInfo(ev);
      return modalPage(
        <LiveVideoPlayer
          link={link}
          title={info.title}
          status={info.status}
          stream={info.status === StreamState.Live ? info.stream : info.recording}
          poster={info.image}
        />,
      );
    }
    default: {
      return modalPage(<ExternalLink href={`https://snort.social/${link.encode()}`}>{link.encode()}</ExternalLink>);
    }
  }
}

export function EventEmbed({ link, ...props }: EventProps & HTMLProps<HTMLDivElement>) {
  const event = useEventFeed(link);
  if (event) {
    return (
      <div className="md:w-[700px] mx-auto w-full">
        <NostrEvent ev={event} {...props} />
      </div>
    );
  }
}
