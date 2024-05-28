import { NostrLink, TaggedNostrEvent } from "@snort/system";
import { Helmet } from "react-helmet";
import { Suspense, lazy, useEffect } from "react";
import { useMediaQuery } from "usehooks-ts";

const LiveVideoPlayer = lazy(() => import("@/element/stream/live-video-player"));
import { extractStreamInfo, getHost } from "@/utils";
import { LiveChat } from "@/element/chat/live-chat";
import { useZapGoal } from "@/hooks/goals";
import { StreamCards } from "@/element/stream-cards";
import { ContentWarningOverlay, useContentWarning } from "@/element/nsfw";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { StreamState } from "@/const";
import { StreamInfo } from "@/element/stream/stream-info";
import { useLayout } from "./layout/context";
import { StreamContextProvider } from "@/element/stream/stream-state";

export function StreamPage({ link, evPreload }: { evPreload?: TaggedNostrEvent; link: NostrLink }) {
  const ev = useCurrentStreamFeed(link, true, evPreload);
  const host = getHost(ev);
  const evLink = ev ? NostrLink.fromEvent(ev) : undefined;
  const {
    title,
    summary,
    image,
    status,
    tags,
    contentWarning,
    stream,
    recording,
    goal: goalTag,
  } = extractStreamInfo(ev);
  const goal = useZapGoal(goalTag);
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const isGrownUp = useContentWarning();
  const layout = useLayout();

  useEffect(() => {
    if (layout.leftNav) {
      layout.update(c => {
        c.leftNav = false;
        return { ...c };
      });
    }
  }, [layout]);

  useEffect(() => {
    return () => {
      layout.update(c => {
        c.leftNav = true;
        return { ...c };
      });
    };
  }, []);

  if (contentWarning && !isGrownUp) {
    return <ContentWarningOverlay />;
  }

  const descriptionContent = [
    title,
    (summary?.length ?? 0) > 0 ? summary : "Nostr live streaming",
    ...(tags ?? []),
  ].join(", ");
  return (
    <StreamContextProvider link={link}>
      <div className="xl:grid xl:grid-cols-[auto_450px] 2xl:xl:grid-cols-[auto_500px] max-xl:flex max-xl:flex-col xl:gap-4 max-xl:gap-1 h-full">
        <Helmet>
          <title>{`${title} - zap.stream`}</title>
          <meta name="description" content={descriptionContent} />
          <meta property="og:url" content={`https://${window.location.host}/${link.encode()}`} />
          <meta property="og:type" content="video" />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={descriptionContent} />
          <meta property="og:image" content={image ?? ""} />
        </Helmet>
        <div className="flex flex-col gap-2 xl:overflow-y-auto scrollbar-hidden">
          <Suspense>
            <LiveVideoPlayer
              title={title}
              stream={status === StreamState.Live ? stream : recording}
              poster={image}
              status={status}
              className="max-xl:max-h-[30vh] xl:w-full xl:max-h-[85dvh] mx-auto"
            />
          </Suspense>
          <div className="lg:px-5 max-lg:px-2">
            <StreamInfo ev={ev as TaggedNostrEvent} goal={goal} />
            {isDesktop && <StreamCards host={host} />}
          </div>
        </div>
        <LiveChat
          link={evLink ?? link}
          ev={ev}
          goal={goal}
          canWrite={status === StreamState.Live}
          adjustLayout={!isDesktop}
          showGoal={true}
          className="min-h-0 xl:border xl:border-layer-2 xl:rounded-xl xl:p-3 max-xl:px-2 h-inherit"
        />
      </div>
    </StreamContextProvider>
  );
}
