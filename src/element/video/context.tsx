import { VideoInfo } from "@/service/video/info";
import { TaggedNostrEvent } from "@snort/system";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

interface VideoPlayerContext {
  video: VideoInfo;
  event: TaggedNostrEvent;
  widePlayer: boolean;
  update: (fn: (c: VideoPlayerContext) => VideoPlayerContext) => void;
}

const VPContext = createContext<VideoPlayerContext>({
  widePlayer: false,
  update: () => {},
} as unknown as VideoPlayerContext);

export function useVideoPlayerContext() {
  return useContext(VPContext);
}

export function VideoPlayerContextProvider({ event, children }: { event: TaggedNostrEvent; children?: ReactNode }) {
  const info = VideoInfo.parse(event);
  const [state, setState] = useState<VideoPlayerContext>({
    video: info,
    event,
    widePlayer: localStorage.getItem("wide-player") === "true",
    update: (fn: (c: VideoPlayerContext) => VideoPlayerContext) => {
      setState(fn);
    },
  });

  useEffect(() => {
    localStorage.setItem("wide-player", String(state.widePlayer));
  }, [state.widePlayer]);

  return <VPContext.Provider value={state}>{children}</VPContext.Provider>;
}
