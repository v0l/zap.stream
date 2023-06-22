import Hls from "hls.js";
import { HTMLProps, useEffect, useMemo, useRef } from "react";

export function LiveVideoPlayer(props: HTMLProps<HTMLVideoElement> & { stream?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const streamCached = useMemo(() => props.stream, [props.stream]);

  useEffect(() => {
    if (streamCached && video.current && !video.current.src && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamCached);
      hls.attachMedia(video.current);
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.debug(event, data);
        const errorType = data.type;
        if(errorType === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.stopLoad();
          hls.detachMedia();
        }
      })
      return () => hls.destroy();
    }
  }, [video, streamCached]);
  return (
    <div>
      <video ref={video} {...props} controls={true} />
    </div>
  );
}
