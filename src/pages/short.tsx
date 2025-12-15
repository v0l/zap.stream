import EventReactions from "@/element/event-reactions";
import { VideoInfo } from "@/element/video-info";
import { VideoPlayerContextProvider } from "@/element/video/context";
import VideoPlayer from "@/element/video/player";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import type { NostrLink, TaggedNostrEvent } from "@snort/system";

export function ShortPage({ link, evPreload }: { link: NostrLink; evPreload?: TaggedNostrEvent }) {
  const ev = useCurrentStreamFeed(link, true, evPreload);

  if (!ev) return;
  return (
    <VideoPlayerContextProvider event={ev}>
      <div className="max-xl:py-2 max-xl:w-full xl:w-[550px] mx-auto">
        <div className="relative">
          <VideoPlayer showPip={false} showWideMode={false} loop={true} />
          <div className="absolute bottom-0 -right-14">
            <EventReactions ev={ev} vertical={true} replyKind={1} className="text-white" />
          </div>
        </div>
        <VideoInfo showComments={false} showZap={false} />
      </div>
    </VideoPlayerContextProvider>
  );
}
