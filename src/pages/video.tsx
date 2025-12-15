import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { getHost, findTag } from "@/utils";
import { NostrLink, RequestBuilder, type TaggedNostrEvent } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { FormattedMessage } from "react-intl";

import { useMemo } from "react";
import classNames from "classnames";
import { StreamTile } from "@/element/stream/stream-tile";
import { VIDEO_KIND } from "@/const";
import { VideoPlayerContextProvider, useVideoPlayerContext } from "@/element/video/context";
import VideoPlayer from "@/element/video/player";
import { VideoInfo } from "@/element/video-info";

export function VideoPage({ link, evPreload }: { link: NostrLink; evPreload?: TaggedNostrEvent }) {
  const ev = useCurrentStreamFeed(link, true, evPreload);

  if (!ev) return;
  return (
    <VideoPlayerContextProvider event={ev}>
      <VideoPageInner ev={ev} />
    </VideoPlayerContextProvider>
  );
}

function VideoPageInner({ ev }: { ev: TaggedNostrEvent }) {
  const host = getHost(ev);
  const ctx = useVideoPlayerContext();
  const link = NostrLink.fromEvent(ev);

  return (
    <div
      className={classNames("xl:p-4 grow xl:grid xl:gap-2 xl:grid-cols-[auto_450px]", {
        "xl:w-[1600px] xl:max-w-[1600px] mx-auto": !ctx.widePlayer,
      })}>
      <div
        className={classNames("min-w-0 w-full max-h-[80dvh] aspect-video mx-auto bg-black", {
          "col-span-2": ctx.widePlayer,
        })}>
        <VideoPlayer />
      </div>
      {/* VIDEO INFO & COMMENTS */}
      <VideoInfo showComments={true} />
      <div
        className={classNames("p-2 col-start-2", {
          "row-start-1 row-span-3": !ctx.widePlayer,
          "row-start-2": ctx.widePlayer,
        })}>
        <UpNext pubkey={host} exclude={[link]} />
      </div>
    </div>
  );
}

function UpNext({ pubkey, exclude }: { pubkey: string; exclude: Array<NostrLink> }) {
  const rb = new RequestBuilder(`videos:${pubkey}`);
  rb.withFilter().kinds([VIDEO_KIND]);

  const videos = useRequestBuilder(rb);

  const sorted = useMemo(
    () =>
      videos
        .filter(a => !exclude.some(b => b.equals(NostrLink.fromEvent(a))))
        .sort((a, b) => {
          const pubA = findTag(a, "published_at");
          const pubB = findTag(b, "published_at");
          return Number(pubA) > Number(pubB) ? -1 : 1;
        })
        .slice(0, 10),
    [videos],
  );

  return (
    <div className="flex flex-col gap-2">
      <h3>
        <FormattedMessage defaultMessage="More Videos" />
      </h3>
      {sorted.map(a => (
        <StreamTile ev={a} key={a.id} showStatus={false} style="list" className="h-[100px]" showAvatar={false} />
      ))}
    </div>
  );
}
