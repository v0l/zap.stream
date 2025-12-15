import { NostrLink, TaggedNostrEvent } from "@snort/system";
import { Helmet } from "react-helmet-async";
import { Suspense, lazy } from "react";
import { useMediaQuery } from "usehooks-ts";

const LiveVideoPlayer = lazy(() => import("@/element/stream/live-video-player"));
import { getHost } from "@/utils";
import { LiveChat } from "@/element/chat/live-chat";
import { StreamCards } from "@/element/stream-cards";
import { ContentWarningOverlay, useContentWarning } from "@/element/nsfw";
import { LIVE_STREAM, N94_LIVE_STREAM, StreamState } from "@/const";
import { StreamInfo } from "@/element/stream/stream-info";
import { StreamContextProvider, useStream } from "@/element/stream/stream-state";

function StreamPageContent() {
  const { link, info, event, goal } = useStream();
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const isGrownUp = useContentWarning();

  if (info?.contentWarning && !isGrownUp) {
    return <ContentWarningOverlay />;
  }

  const descriptionContent = [
    info?.title,
    (info?.summary?.length ?? 0) > 0 ? info?.summary : "Nostr live streaming",
    ...(info?.tags ?? []),
  ].join(", ");
  return (
    <div className="xl:grid xl:grid-cols-[auto_450px] 2xl:xl:grid-cols-[auto_500px] max-xl:flex max-xl:flex-col xl:gap-4 max-xl:gap-1 h-full">
      <Helmet>
        <title>{`${info?.title ?? "Untitled"} - zap.stream`}</title>
        <meta name="description" content={descriptionContent} />
        <meta property="og:url" content={`https://${window.location.host}/${link.encode()}`} />
        <meta property="og:type" content="video" />
        <meta property="og:title" content={info?.title ?? "Untitled"} />
        <meta property="og:description" content={descriptionContent} />
        <meta property="og:image" content={info?.image ?? ""} />
      </Helmet>
      <div className="flex flex-col gap-2 xl:overflow-y-auto scrollbar-hidden">
        <Suspense>
          {event?.kind === LIVE_STREAM && link && (
            <LiveVideoPlayer
              id={info?.id}
              title={info?.title}
              stream={info?.status === StreamState.Live ? info?.stream : info?.recording}
              poster={info?.image}
              status={info?.status}
              link={link}
              className="max-xl:max-h-[30vh] xl:w-full xl:max-h-[85dvh] mx-auto"
            />
          )}
          {event?.kind === N94_LIVE_STREAM && link && (
            <LiveVideoPlayer
              id={info?.id}
              title={info?.title}
              stream={info?.stream}
              poster={info?.image}
              status={info?.status}
              link={link}
              className="max-xl:max-h-[30vh] xl:w-full xl:max-h-[85dvh] mx-auto"
            />
          )}
        </Suspense>
        {event && (
          <div className="lg:px-5 max-lg:px-2">
            <StreamInfo ev={event} goal={goal} />
            {isDesktop && <StreamCards host={getHost(event)} />}
          </div>
        )}
      </div>
      <LiveChat
        canWrite={info?.status === StreamState.Live || event?.kind === N94_LIVE_STREAM}
        adjustLayout={!isDesktop}
        showGoal={true}
        className="min-h-0 xl:border xl:border-layer-2 xl:rounded-xl xl:p-3 max-xl:px-2 h-inherit"
      />
    </div>
  );
}

export function StreamPage({ link, evPreload }: { evPreload?: TaggedNostrEvent; link: NostrLink }) {
  return (
    <StreamContextProvider link={link} evPreload={evPreload}>
      <StreamPageContent />
    </StreamContextProvider>
  );
}
