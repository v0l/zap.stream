import { StreamState } from "@/const";
import { extractStreamInfo } from "@/utils";
import { TaggedNostrEvent } from "@snort/system";
import { Suspense } from "react";
import LiveVideoPlayer from "./live-video-player";

export default function LiveEvent({ ev }: { ev: TaggedNostrEvent }) {
  const { title, image, status, stream, recording } = extractStreamInfo(ev);

  return (
    <Suspense>
      <LiveVideoPlayer
        title={title}
        stream={status === StreamState.Live ? stream : recording}
        poster={image}
        status={status}
      />
    </Suspense>
  );
}
