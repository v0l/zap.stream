import { VideoInfo } from "@/service/video/info";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

interface VideoPlayerContext {
  video?: VideoInfo;
  widePlayer: boolean;
  update: (fn: (c: VideoPlayerContext) => VideoPlayerContext) => void;
}

const VPContext = createContext<VideoPlayerContext>({
  widePlayer: false,
  update: () => {},
});

export function useVideoPlayerContext() {
  return useContext(VPContext);
}

export function VideoPlayerContextProvider({ info, children }: { info: VideoInfo; children?: ReactNode }) {
  const [state, setState] = useState<VideoPlayerContext>({
    video: info,
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
