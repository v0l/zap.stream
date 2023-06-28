import Hls from "hls.js";
import { HTMLProps, useEffect, useMemo, useRef, useState } from "react";

export enum VideoStatus {
  Online = "online",
  Offline = "offline",
}

export function LiveVideoPlayer(
  props: HTMLProps<HTMLVideoElement> & { stream?: string }
) {
  const video = useRef<HTMLVideoElement>(null);
  const streamCached = useMemo(() => props.stream, [props.stream]);
  const [status, setStatus] = useState<VideoStatus>();

  useEffect(() => {
    if (
      streamCached &&
      video.current &&
      !video.current.src &&
      Hls.isSupported()
    ) {
      try {
        const hls = new Hls();
        hls.loadSource(streamCached);
        hls.attachMedia(video.current);
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.debug(event, data);
          const errorType = data.type;
          if (errorType === Hls.ErrorTypes.NETWORK_ERROR && data.fatal) {
            hls.stopLoad();
            hls.detachMedia();
            setStatus(VideoStatus.Offline);
          }
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus(VideoStatus.Online);
        });
        return () => hls.destroy();
      } catch (e) {
        console.error(e);
        setStatus(VideoStatus.Offline);
      }
    }
  }, [video, streamCached]);
  return (
    <>
      <div className={status}>
        <div>{status}</div>
      </div>
      <video ref={video} {...props} controls={status === VideoStatus.Online} />
    </>
  );
}
