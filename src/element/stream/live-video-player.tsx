/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type CSSProperties, type HTMLProps, type Ref, Suspense, lazy, useEffect, useRef, useState } from "react"
import classNames from "classnames"
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
  MediaPosterImage,
  MediaTimeDisplay,
  MediaPlaybackRateButton,
} from "media-chrome/react"
import { MediaRenditionMenu, MediaRenditionMenuButton } from "media-chrome/react/menu"
import HlsVideo from "hls-video-element/react"
import type { HlsVideoElement } from "hls-video-element"
import { StreamState } from "@/const"
import { parseYouTubeUrl } from "@/youtube"
import type { NostrLink } from "@snort/system"
import YouTubePlayer from "./youtube-player"
const Nip94Player = lazy(() => import("./n94-player"))
const MoqPlayer = lazy(() => import("./moq-player"))

type VideoPlayerProps = {
  id?: string
  title?: string
  status?: StreamState
  stream?: string
  poster?: string
  link: NostrLink
} & HTMLProps<HTMLVideoElement>

export default function LiveVideoPlayer({ title, stream, status, poster, link, ...props }: VideoPlayerProps) {
  const playerRef = useRef<HTMLVideoElement | null>(null)
  const [canCast, setCanCast] = useState(false)
  const yt = stream ? parseYouTubeUrl(stream) : undefined

  useEffect(() => {
    if (playerRef.current && "remote" in playerRef.current) {
      playerRef.current.remote.watchAvailability(a => {
        console.debug("Cast support: ", a)
        setCanCast(a)
      })
    }
  }, [playerRef])

  // hls-video-element does not destroy its hls.js instance on unmount,
  // which leaves the playlist loading in the background after navigating away.
  // Clearing src triggers its internal #destroy() (recommended by upstream):
  // https://github.com/muxinc/media-elements/discussions/82
  useEffect(() => {
    const el = playerRef.current as HlsVideoElement | null
    return () => {
      if (el?.api) {
        el.src = ""
      }
    }
  }, [stream])
  function innerPlayer() {
    if (stream === "n94") {
      return (
        <Suspense>
          <Nip94Player {...props} link={link} />
        </Suspense>
      )
    } else if (stream?.toLowerCase().endsWith(".m3u8")) {
      // hls video
      return (
        <HlsVideo
          id={props.id}
          className={props.className}
          slot="media"
          src={stream}
          playsInline
          autoplay
          // HlsVideoElement extends HTMLVideoElement; shared ref type is HTMLVideoElement
          ref={playerRef as Ref<HlsVideoElement>}
          config={{
            lowLatencyMode: true,
            // enable on demand via: localStorage.setItem("hls-debug", "true")
            debug: localStorage.getItem("hls-debug") === "true",
          }}
        />
      )
    } else if (stream?.startsWith("moq://")) {
      return (
        <Suspense>
          <MoqPlayer stream={stream} id={props.id} />
        </Suspense>
      )
    } else {
      // other video formats (e.g. mp4)
      return <video {...props} slot="media" src={stream} playsInline={true} autoPlay={true} ref={playerRef} />
    }
  }

  const titleBar = (
    <div slot="top-chrome" className="py-1 text-center w-full text-2xl bg-primary">
      {title}
    </div>
  )

  // YouTube links can't be played by a <video> element or hls.js; embed them
  // in an iframe instead. Media Chrome can't drive a cross-origin iframe, so
  // the controls (and poster/PiP/cast) come from the YouTube player itself.
  if (yt) {
    return (
      <div className={classNames(props.className, "h-inherit aspect-video w-full")}>
        <div className="flex flex-col h-full w-full bg-black">
          {titleBar}
          <YouTubePlayer id={props.id} video={yt} title={title} className="flex-1 min-h-0 w-full border-0" />
        </div>
      </div>
    )
  }

  return (
    <MediaController
      className={classNames(props.className, "h-inherit aspect-video w-full")}
      style={
        {
          "--media-secondary-color": "var(--primary)",
          "--media-control-hover-background": "color-mix(in srgb, var(--primary) 80%, transparent)",
        } as CSSProperties
      }
    >
      {titleBar}
      {innerPlayer()}
      <MediaRenditionMenu hidden anchor="auto" />
      {poster && <MediaPosterImage slot="poster" src={poster} />}
      <MediaControlBar>
        <MediaPlayButton />
        {status === StreamState.Live && <MediaLiveButton />}
        {status === StreamState.Ended && <MediaPlaybackRateButton />}
        <MediaTimeRange />
        {status === StreamState.Ended && <MediaTimeDisplay showDuration />}
        <MediaMuteButton />
        <MediaVolumeRange />
        {status === StreamState.Live && <MediaRenditionMenuButton />}
        <MediaPipButton />
        {canCast && <MediaCastButton />}
        <MediaFullscreenButton />
      </MediaControlBar>
    </MediaController>
  )
}
