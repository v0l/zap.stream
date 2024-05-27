import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlayButton,
  MediaMuteButton,
  MediaFullscreenButton,
  MediaPipButton,
  MediaPlaybackRateButton,
} from "media-chrome/react";
import { MediaPlayerSizeButtonReact } from "@/element/video/video-size-button";
import useImgProxy from "@/hooks/img-proxy";
import { useMediaQuery } from "usehooks-ts";
import { useVideoPlayerContext } from "./context";

export default function VideoPlayer() {
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const ctx = useVideoPlayerContext();

  const { proxy } = useImgProxy();
  return (
    <MediaController className="min-w-0 w-full" mediaStreamType="on-demand">
      <video
        className="max-h-[80dvh] aspect-video"
        slot="media"
        autoPlay={true}
        controls={false}
        poster={proxy(ctx.video?.bestPoster()?.url ?? "")}>
        {ctx.video?.sources().map(a => <source src={a.url} type={a.mimeType} />)}
      </video>
      <MediaControlBar>
        <MediaPlayButton />
        <MediaPlaybackRateButton />
        <MediaTimeRange />
        <MediaTimeDisplay showDuration></MediaTimeDisplay>
        <MediaMuteButton />
        <MediaVolumeRange />
        <MediaPipButton />
        <MediaFullscreenButton />
        {isDesktop && (
          <MediaPlayerSizeButtonReact
            onClick={() =>
              ctx.update(c => ({
                ...c,
                widePlayer: !c.widePlayer,
              }))
            }
          />
        )}
      </MediaControlBar>
    </MediaController>
  );
}
