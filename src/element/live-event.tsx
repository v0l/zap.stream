import { StreamState } from "@/const";
import { extractStreamInfo } from "@/utils";
import { NostrLink, TaggedNostrEvent } from "@snort/system";
import { Suspense } from "react";
import LiveVideoPlayer from "./stream/live-video-player";

export default function LiveEvent({ ev }: { ev: TaggedNostrEvent }) {
  const { id, title, image, status, stream, recording } = extractStreamInfo(ev);

  return (
    <Suspense>
      <LiveVideoPlayer
        id={id}
        title={title}
        stream={status === StreamState.Live ? stream : recording}
        poster={image}
        status={status}
        link={NostrLink.fromEvent(ev)}
      />
    </Suspense>
  );
}
