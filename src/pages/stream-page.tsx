import type { NostrLink, TaggedNostrEvent } from "@snort/system"
import { Helmet } from "@dr.pogodin/react-helmet"
import { useMediaQuery } from "usehooks-ts"

import LiveVideoPlayer from "@/element/stream/live-video-player"
import { getHost } from "@/utils"
import { LiveChat } from "@/element/chat/live-chat"
import { StreamCards } from "@/element/stream-cards"
import { ContentWarningOverlay, useContentWarning } from "@/element/nsfw"
import { LIVE_STREAM, N94_LIVE_STREAM, StreamState } from "@/const"
import { StreamInfo } from "@/element/stream/stream-info"
import { StreamContextProvider, useStream } from "@/element/stream/stream-state"

function StreamPageContent() {
  const { link, info, event, goal } = useStream()
  const isDesktop = useMediaQuery("(min-width: 1280px)", { initializeWithValue: false })
  const isGrownUp = useContentWarning()

  if (info?.contentWarning && !isGrownUp) {
    return <ContentWarningOverlay />
  }

  const descriptionContent = [
    info?.title,
    (info?.summary?.length ?? 0) > 0 ? info?.summary : "Nostr live streaming",
    ...(info?.tags ?? []),
  ].join(", ")
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_440px] max-xl:flex max-xl:flex-col xl:gap-6 xl:p-6 h-full min-h-0">
      <Helmet>
        <title>{`${info?.title ?? "Untitled"} - zap.stream`}</title>
        <meta name="description" content={descriptionContent} />
        {link && <meta property="og:url" content={`https://${window.location.host}/${link.encode()}`} />}
        <meta property="og:type" content="video" />
        <meta property="og:title" content={info?.title ?? "Untitled"} />
        <meta property="og:description" content={descriptionContent} />
        <meta property="og:image" content={info?.image ?? ""} />
      </Helmet>
      <div className="flex flex-col gap-5 xl:overflow-y-auto scrollbar-hidden min-h-0">
        {event?.kind === LIVE_STREAM && link && (
          <LiveVideoPlayer
            key={link.encode()}
            id={info?.id}
            title={info?.title}
            stream={info?.status === StreamState.Live ? info?.stream : info?.recording}
            poster={info?.image}
            status={info?.status}
            link={link}
            className="max-xl:max-h-[30dvh] xl:w-full xl:max-h-[72dvh] mx-auto xl:rounded-2xl overflow-hidden bg-black"
          />
        )}
        {event?.kind === N94_LIVE_STREAM && link && (
          <LiveVideoPlayer
            key={link.encode()}
            id={info?.id}
            title={info?.title}
            stream={info?.stream}
            poster={info?.image}
            status={info?.status}
            link={link}
            className="max-xl:max-h-[30dvh] xl:w-full xl:max-h-[72dvh] mx-auto xl:rounded-2xl overflow-hidden bg-black"
          />
        )}
        {event && (
          <div className="flex flex-col gap-6 max-xl:px-4 max-xl:py-3">
            <StreamInfo ev={event} goal={goal} />
            {isDesktop && <StreamCards host={getHost(event)} />}
          </div>
        )}
      </div>
      <LiveChat
        canWrite={info?.status === StreamState.Live || event?.kind === N94_LIVE_STREAM}
        adjustLayout={!isDesktop}
        showGoal={true}
        showHeader={isDesktop}
        className="min-h-0 xl:border xl:border-layer-3 xl:bg-layer-1 xl:rounded-2xl xl:overflow-hidden max-xl:px-3 h-inherit"
      />
    </div>
  )
}

export function StreamPage({ link, evPreload }: { evPreload?: TaggedNostrEvent; link: NostrLink }) {
  return (
    <StreamContextProvider link={link} evPreload={evPreload}>
      <StreamPageContent />
    </StreamContextProvider>
  )
}
