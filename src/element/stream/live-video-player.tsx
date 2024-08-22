/* eslint-disable @typescript-eslint/ban-ts-comment */
import { CSSProperties, HTMLProps } from "react";
import classNames from "classnames";
import {
  MediaControlBar,
  MediaController,
  MediaFullscreenButton,
  MediaMuteButton,
  MediaPipButton,
  MediaPlayButton,
  MediaTimeRange,
  MediaVolumeRange,
  MediaCastButton,
  MediaLiveButton,
  MediaRenditionMenu,
  MediaRenditionMenuButton,
  MediaPosterImage,
  MediaTimeDisplay,
  MediaPlaybackRateButton,
} from "media-chrome/react";
import "hls-video-element";
import { StreamState } from "@/const";

type VideoPlayerProps = {
  title?: string;
  status?: StreamState;
  stream?: string;
  poster?: string;
  muted?: boolean;
} & HTMLProps<HTMLVideoElement>;

export default function LiveVideoPlayer({ title, stream, status, poster, ...props }: VideoPlayerProps) {
  return (
    <MediaController
      className={classNames(props.className, "h-inherit aspect-video w-full")}
      style={
        {
          "--media-secondary-color": "var(--primary)",
          "--media-control-hover-background": "color-mix(in srgb, var(--primary) 80%, transparent)",
        } as CSSProperties
      }>
      <div slot="top-chrome" className="py-1 text-center w-full text-2xl bg-primary">
        {title}
      </div>
      {/* @ts-ignore Web Componenet */}
      <hls-video {...props} slot="media" src={stream} playsInline={true} />
      <MediaRenditionMenu hidden anchor="auto" />
      {poster && <MediaPosterImage slot="poster" src={poster} />}
      <MediaControlBar>
        <MediaPlayButton />
        {status === StreamState.Live && <MediaLiveButton />}
        {status === StreamState.Ended && <MediaPlaybackRateButton />}
        <MediaTimeRange />
        {status === StreamState.Ended && <MediaTimeDisplay showduration={true} />}
        <MediaMuteButton />
        <MediaVolumeRange />
        {status === StreamState.Live && <MediaRenditionMenuButton />}
        <MediaPipButton />
        <MediaCastButton />
        <MediaFullscreenButton />
      </MediaControlBar>
    </MediaController>
  );
}
