import Hls from "hls.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { WISH } from "wish";

export enum VideoStatus {
  Online = "online",
  Offline = "offline",
}

export interface VideoPlayerProps {
  stream?: string, status?: string, poster?: string
}

export function LiveVideoPlayer(
  props: VideoPlayerProps
) {
  const video = useRef<HTMLVideoElement>(null);
  const streamCached = useMemo(() => props.stream, [props.stream]);
  const [status, setStatus] = useState<VideoStatus>();
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    if (
      streamCached &&
      video.current
    ) {
      if (Hls.isSupported()) {
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
          hls.on(Hls.Events.LEVEL_SWITCHING, (e, l) => {
            console.debug("HLS Level Switch", l);
          });
          return () => hls.destroy();
        } catch (e) {
          console.error(e);
          setStatus(VideoStatus.Offline);
        }
      } else {
        setSrc(streamCached);
        setStatus(VideoStatus.Online);
        video.current.muted = true;
        video.current.load();
      }
    }
  }, [video, streamCached, props.status]);

  return (
    <>
      <div className={status}>
        <div>{status}</div>
      </div>
      <video ref={video} autoPlay={true} poster={props.poster} src={src} playsInline={true} controls={status === VideoStatus.Online} />
    </>
  );
}

export function WebRTCPlayer(props: VideoPlayerProps) {
  const video = useRef<HTMLVideoElement>(null);
  const streamCached = useMemo(() => "https://customer-uu10flpvos4pfhgu.cloudflarestream.com/7634aee1af35a2de4ac13ca3d1718a8b/webRTC/play", [props.stream]);
  const [status] = useState<VideoStatus>();
  //https://customer-uu10flpvos4pfhgu.cloudflarestream.com/7634aee1af35a2de4ac13ca3d1718a8b/webRTC/play

  useEffect(() => {
    if (video.current && streamCached) {
      const client = new WISH();
      client.addEventListener("log", console.debug);
      client.WithEndpoint(streamCached, true)

      client.Play().then(s => {
        if (video.current) {
          video.current.srcObject = s;
        }
      }).catch(console.error);
      return () => { client.Disconnect().catch(console.error); }
    }
  }, [video, streamCached]);

  return (
    <>
      <div className={status}>
        <div>{status}</div>
      </div>
      <video ref={video} autoPlay={true} poster={props.poster} controls={status === VideoStatus.Online} />
    </>
  );
}