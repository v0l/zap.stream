/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type CSSProperties, Suspense, lazy, useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import {
  MediaControlBar,
  MediaController,
  MediaFullscreenButton,
  MediaMuteButton,
  MediaPlayButton,
  MediaTimeRange,
  MediaVolumeRange,
  MediaCastButton,
  MediaLiveButton,
  MediaPosterImage,
  MediaTimeDisplay,
  MediaPlaybackRateButton,
} from 'media-chrome/react'
// import { MediaRenditionMenu, MediaRenditionMenuButton } from 'media-chrome/react/menu'
import 'hls-video-element'
import { StreamState } from '../../const'
import type { NostrLink } from '@snort/system'
const Nip94Player = lazy(() => import('./n94-player'))
const MoqPlayer = lazy(() => import('./moq-player'))

declare namespace JSX {
  interface IntrinsicElements {
    'hls-video-element': any
  }
}

interface VideoPlayerProps {
  title?: string
  stream?: string
  status?: StreamState
  poster?: string
  link?: NostrLink
  [key: string]: any
}

export default function LiveVideoPlayer({ title, stream, status, poster, link, ...props }: VideoPlayerProps) {
  const playerRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<HTMLVideoElement | null>(null)
  const [canCast, setCanCast] = useState(false)

  // Generate a unique ID for this instance to track duplicates
  const instanceId = Math.random().toString(36).substring(2, 9)

  // Debug props received
  useEffect(() => {
    console.debug(`LiveVideoPlayer [${instanceId}] Props received:`, { title, stream, status, poster, link })
  }, [instanceId, title, stream, status, poster, link])

  // Debug mount/unmount tracking
  useEffect(() => {
    console.debug(`LiveVideoPlayer [${instanceId}] mounted`)
    return () => {
      console.debug(`LiveVideoPlayer [${instanceId}] unmounted`)
      // Additional cleanup attempt on unmount
      if (hlsRef.current) {
        console.debug(`LiveVideoPlayer [${instanceId}] Attempting to cleanup hls-video-element on unmount`)
        try {
          // Try to access HLS.js instance if available
          // @ts-expect-error
          if (hlsRef.current.hls) {
            console.debug(`LiveVideoPlayer [${instanceId}] Destroying HLS.js instance`)
            // @ts-expect-error
            hlsRef.current.hls.destroy()
          }
          // Try to call destroy method on the element itself if it exists
          // @ts-expect-error
          if (typeof hlsRef.current.destroy === 'function') {
            console.debug(`LiveVideoPlayer [${instanceId}] Calling hls-video-element destroy method`)
            // @ts-expect-error
            hlsRef.current.destroy()
          }
          // Pause and reset the media element
          hlsRef.current.pause()
          hlsRef.current.removeAttribute('src')
          hlsRef.current.load()
        } catch (e: unknown) {
          console.warn(`LiveVideoPlayer [${instanceId}] Error during hls-video-element cleanup:`, e)
        }
      }
    }
  }, [instanceId])

  // Cast availability subscription
  useEffect(() => {
    let castSubscription: (() => void) | undefined
    if (playerRef.current && 'remote' in playerRef.current) {
      // @ts-expect-error
      castSubscription = playerRef.current.remote.watchAvailability(a => {
        console.debug('Cast support: ', a)
        setCanCast(a)
      })
    }

    // Cleanup when component unmounts
    return () => {
      if (castSubscription) {
        castSubscription()
      }
    }
  }, [instanceId])

  function innerPlayer() {
    if (!stream) {
      console.warn(`LiveVideoPlayer [${instanceId}] No stream provided`)
      return null
    }

    console.debug(`LiveVideoPlayer [${instanceId}] Rendering stream:`, stream)
    // Validate stream URL for HLS
    if (stream?.toLowerCase().endsWith('.m3u8')) {
      console.debug(`LiveVideoPlayer [${instanceId}] Stream appears to be HLS URL:`, stream)

      // Additional validation
      try {
        const url = new URL(stream)
        console.debug(`LiveVideoPlayer [${instanceId}] Stream URL is valid:`, url.toString())
      } catch (e) {
        console.warn(`LiveVideoPlayer [${instanceId}] Stream URL appears invalid:`, e)
      }
    }

    if (stream === 'n94') {
      return (
        <Suspense>
          <Nip94Player {...props} link={link} />
        </Suspense>
      )
    } else if (stream?.toLowerCase().endsWith('.m3u8')) {
      // hls video - add error boundary and additional diagnostics
      return (
        <div>
          <hls-video-element
            key={stream}
            {...props}
            slot="media"
            src={stream}
            playsInline={true}
            autoPlay={true}
            ref={hlsRef}
            style={{ minHeight: '200px', width: '100%', backgroundColor: '#000' }}
            onLoadStart={(e: Event) => {
              console.debug('HLS video [', instanceId, ']: loadstart')
              // Try to get video element properties
              if (hlsRef.current) {
                console.debug('HLS video [', instanceId, ']: networkState:', hlsRef.current.networkState)
                console.debug('HLS video [', instanceId, ']: readyState:', hlsRef.current.readyState)
                console.debug('HLS video [', instanceId, ']: src:', hlsRef.current.src)
                console.debug('HLS video [', instanceId, ']: currentSrc:', hlsRef.current.currentSrc)
                console.debug('HLS video [', instanceId, ']: seeking:', hlsRef.current.seeking)
                console.debug('HLS video [', instanceId, ']: ended:', hlsRef.current.ended)
              }
            }}
            onCanPlay={(e: Event) => {
              console.debug('HLS video [', instanceId, ']: canplay')
              // Try to get video element properties
              if (hlsRef.current) {
                console.debug('HLS video [', instanceId, ']: networkState:', hlsRef.current.networkState)
                console.debug('HLS video [', instanceId, ']: readyState:', hlsRef.current.readyState)
                console.debug('HLS video [', instanceId, ']: src:', hlsRef.current.src)
                console.debug('HLS video [', instanceId, ']: currentSrc:', hlsRef.current.currentSrc)
                console.debug('HLS video [', instanceId, ']: seeking:', hlsRef.current.seeking)
                console.debug('HLS video [', instanceId, ']: ended:', hlsRef.current.ended)
              }
            }}
            onPlay={(e: Event) => {
              console.debug('HLS video [', instanceId, ']: play')
              if (hlsRef.current) {
                console.debug('HLS video [', instanceId, ']: videoWidth:', hlsRef.current.videoWidth)
                console.debug('HLS video [', instanceId, ']: videoHeight:', hlsRef.current.videoHeight)
              }
            }}
            onPause={(e: Event) => console.debug('HLS video [', instanceId, ']: pause')}
            onError={(e: Event) => console.error('HLS video [', instanceId, '] error:', e)}
            // Additional event listeners for more detailed debugging
            onWaiting={(e: Event) => console.debug('HLS video [', instanceId, ']: waiting')}
            onSeeking={(e: Event) => console.debug('HLS video [', instanceId, ']: seeking')}
            onSeeked={(e: Event) => console.debug('HLS video [', instanceId, ']: seeked')}
            onVolumeChange={() => console.debug('HLS video [', instanceId, ']: volumechange')}
          />
          {/* Diagnostic overlay */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '5px',
              fontSize: '12px',
            }}
          >
            HLS Diagnostics
            <br />
            Stream: {stream?.substring(0, 50) + (stream?.length > 50 ? '...' : '')}
            <br />
            Instance: {instanceId}
            <br />
            <div id={`video-diagnostics-${instanceId}`}>Checking...</div>
          </div>
        </div>
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
      <div style={{ border: '2px solid blue', minHeight: '200px' }}>{innerPlayer()}</div>
      {/* <MediaRenditionMenu hidden anchor="auto" /> */}
      {poster && <MediaPosterImage slot="poster" src={poster} />}
      <MediaControlBar>
        <MediaPlayButton />
        {status === StreamState.Live && <MediaLiveButton />}
        {status === StreamState.Ended && <MediaPlaybackRateButton />}
        <MediaTimeRange />
        {status === StreamState.Ended && <MediaTimeDisplay showDuration />}
        <MediaMuteButton />
        <MediaVolumeRange />
        {/* {status === StreamState.Live && <MediaRenditionMenuButton />} */}
        <MediaPlayButton />
        {canCast && <MediaCastButton />}
        <MediaFullscreenButton />
      </MediaControlBar>
    </MediaController>
  )
}
