import { WriteMessage } from "@/element/chat/write-message";
import { FollowButton } from "@/element/follow-button";
import { Profile, getName } from "@/element/profile";
import { SendZapsDialog } from "@/element/send-zap";
import { ShareMenu } from "@/element/share-menu";
import { StreamSummary } from "@/element/stream/summary";
import VideoComments from "@/element/video/comments";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { getHost, findTag } from "@/utils";
import { NostrLink, RequestBuilder, TaggedNostrEvent } from "@snort/system";
import { useRequestBuilder, useUserProfile } from "@snort/system-react";
import { FormattedMessage } from "react-intl";

import { useMemo } from "react";
import classNames from "classnames";
import { VideoTile } from "@/element/video-tile";
import { VIDEO_KIND } from "@/const";
import { VideoInfo } from "@/service/video/info";
import { VideoPlayerContextProvider, useVideoPlayerContext } from "@/element/video/context";
import VideoPlayer from "@/element/video/player";

export function VideoPage({ link, evPreload }: { link: NostrLink; evPreload?: TaggedNostrEvent }) {
  const ev = useCurrentStreamFeed(link, true, evPreload);

  if (!ev) return;
  const video = VideoInfo.parse(ev);

  return (
    <VideoPlayerContextProvider info={video}>
      <VideoPageInner ev={ev} />
    </VideoPlayerContextProvider>
  );
}

function VideoPageInner({ ev }: { ev: TaggedNostrEvent }) {
  const host = getHost(ev);
  const ctx = useVideoPlayerContext();
  const link = NostrLink.fromEvent(ev);

  const profile = useUserProfile(host);
  const zapTarget = profile?.lud16 ?? profile?.lud06;

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
      <div
        className={classNames("row-start-2 col-start-1 max-xl:px-4 flex flex-col gap-4", {
          "mx-auto w-[40dvw]": ctx.widePlayer,
        })}>
        <div className="font-medium text-xl">{ctx.video?.title}</div>
        <div className="flex justify-between">
          {/* PROFILE SECTION */}
          <div className="flex gap-2 items-center">
            <Profile pubkey={host} />
            <FollowButton pubkey={host} />
          </div>
          {/* ACTIONS */}
          <div className="flex gap-2">
            {ev && (
              <>
                <ShareMenu ev={ev} />
                {zapTarget && (
                  <SendZapsDialog
                    lnurl={zapTarget}
                    pubkey={host}
                    aTag={link.tagKey}
                    targetName={getName(ev.pubkey, profile)}
                  />
                )}
              </>
            )}
          </div>
        </div>
        {ctx.video?.summary && <StreamSummary text={ctx.video.summary} />}
        <h3>
          <FormattedMessage defaultMessage="Comments" />
        </h3>
        <div>
          <WriteMessage link={link} emojiPacks={[]} kind={1} />
        </div>
        <VideoComments link={link} />
      </div>
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
        <VideoTile ev={a} key={a.id} showStatus={false} style="list" className="h-[100px]" showAvatar={false} />
      ))}
    </div>
  );
}
