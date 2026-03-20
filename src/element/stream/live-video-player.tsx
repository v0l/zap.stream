/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type CSSProperties, type HTMLProps, Suspense, lazy, useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
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
} from 'media-chrome/react'
import { MediaRenditionMenu, MediaRenditionMenuButton } from 'media-chrome/react/menu'
import 'hls-video-element'
import { StreamState } from '@/const'
import type { NostrLink } from '@snort/system'
import { useCast } from '@/hooks/useCast'
const Nip94Player = lazy(() => import('./n94-player'))
const MoqPlayer = lazy(() => import('./moq-player'))

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
  const { isAvailable, isConnected, castMedia, stopCasting } = useCast()

  useEffect(() => {
    console.log('LiveVideoPlayer useEffect running')
    console.log('playerRef.current:', playerRef.current)
    if (playerRef.current) {
      console.log('playerRef.current has remote:', 'remote' in playerRef.current)
      if ('remote' in playerRef.current) {
        console.log('Setting up cast availability watcher')
        playerRef.current.remote.watchAvailability(a => {
          console.debug('Cast support: ', a)
          setCanCast(a)
        })
      }
    }
  }, [playerRef])

  useEffect(() => {
    console.log('LiveVideoPlayer: Cast availability changed:', { isAvailable, isConnected })
  }, [isAvailable, isConnected])

  function innerPlayer() {
    if (stream === 'n94') {
      return (
        <Suspense>
          <Nip94Player {...props} link={link} />
        </Suspense>
      )
    } else if (stream?.toLowerCase().endsWith('.m3u8')) {
      return (
        <hls-video
          {...props}
          slot="media"
          src={stream}
          playsInline={true}
          autoPlay={true}
          ref={playerRef}
          config={{
            lowLatencyMode: true,
            debug: true,
          }}
        />
      )
    } else if (stream?.startsWith('moq://')) {
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

  // Get current media URL and title for casting
  const mediaUrl = stream ?? ''
  const mediaTitle = title ?? 'zap.stream'

  return (
    <MediaController
      className={classNames(props.className, 'h-inherit aspect-video w-full')}
      style={
        {
          '--media-secondary-color': 'var(--primary)',
          '--media-control-hover-background': 'color-mix(in srgb, var(--primary) 80%, transparent)',
        } as CSSProperties
      }
    >
      <div slot="top-chrome" className="py-1 text-center w-full text-2xl bg-primary">
        {title}
      </div>
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
        {/* Cast button - use native if available, fallback to custom */}
        {!(canCast || isAvailable) && (
          <button
            className="cast-button"
            onClick={isConnected ? stopCasting : () => castMedia(mediaUrl, mediaTitle)}
            aria-label={isConnected ? 'Stop casting' : 'Cast to device'}
            title={isConnected ? 'Stop casting' : 'Cast to device'}
          >
            {isConnected ? '📺' : '📻'}
          </button>
        )}
        {(canCast || isAvailable) && <MediaCastButton />}
        <MediaFullscreenButton />
      </MediaControlBar>
    </MediaController>
  )
}
