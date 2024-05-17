import { StreamInfo } from "@/element/stream-info";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { getHost, extractStreamInfo } from "@/utils";
import { NostrLink, TaggedNostrEvent } from "@snort/system";

export function VideoPage({ link, evPreload }: { link: NostrLink; evPreload?: TaggedNostrEvent }) {
  const ev = useCurrentStreamFeed(link, true, evPreload);
  const host = getHost(ev);
  const evLink = ev ? NostrLink.fromEvent(ev) : undefined;
  const {
    title,
    summary,
    image,
    status,
    tags,
    contentWarning,
    stream,
    recording,
    goal: goalTag,
  } = extractStreamInfo(ev);

  return (
    <div className="p-4 w-[80dvw] mx-auto">
      <video src={recording} controls className="w-full aspect-video" />
      <StreamInfo ev={ev as TaggedNostrEvent} />
    </div>
  );
}
