import { WriteMessage } from "@/element/chat/write-message";
import { FollowButton } from "@/element/follow-button";
import { Profile, getName } from "@/element/profile";
import { SendZapsDialog } from "@/element/send-zap";
import { ShareMenu } from "@/element/share-menu";
import { StreamSummary } from "@/element/stream/summary";
import VideoComments from "@/element/video/comments";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import useImgProxy from "@/hooks/img-proxy";
import { getHost, extractStreamInfo, findTag } from "@/utils";
import { NostrLink, RequestBuilder, TaggedNostrEvent } from "@snort/system";
import { useRequestBuilder, useUserProfile } from "@snort/system-react";
import { FormattedMessage } from "react-intl";
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
import { useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { useMediaQuery } from "usehooks-ts";
import { VideoTile } from "@/element/video-tile";
import { VIDEO_KIND } from "@/const";

export function VideoPage({ link, evPreload }: { link: NostrLink; evPreload?: TaggedNostrEvent }) {
  const ev = useCurrentStreamFeed(link, true, evPreload);
  const host = getHost(ev);
  const [widePlayer, setWidePlayer] = useState(localStorage.getItem("wide-player") === "true");
  const { title, summary, image, contentWarning, recording } = extractStreamInfo(ev);
  const profile = useUserProfile(host);
  const { proxy } = useImgProxy();
  const zapTarget = profile?.lud16 ?? profile?.lud06;
  const isDesktop = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    localStorage.setItem("wide-player", String(widePlayer));
  }, [widePlayer]);

  return (
    <div
      className={classNames("lg:p-4 grow lg:grid lg:gap-2 lg:grid-cols-[auto_450px]", {
        "max-w-[60dvw] mx-auto": !widePlayer,
      })}>
      <div
        className={classNames("min-w-0 w-full max-h-[80dvh] aspect-video mx-auto bg-black", {
          "col-span-2": widePlayer,
        })}>
        <MediaController className="min-w-0 w-full" mediaStreamType="on-demand">
          <video
            className="max-h-[80dvh] aspect-video"
            slot="media"
            src={recording}
            autoPlay={true}
            controls={false}
            poster={proxy(image ?? recording ?? "")}
          />
          <MediaControlBar>
            <MediaPlayButton />
            <MediaPlaybackRateButton />
            <MediaTimeRange />
            <MediaTimeDisplay showDuration></MediaTimeDisplay>
            <MediaMuteButton />
            <MediaVolumeRange />
            <MediaPipButton />
            <MediaFullscreenButton />
            {isDesktop && <MediaPlayerSizeButtonReact onClick={() => setWidePlayer(w => !w)} />}
          </MediaControlBar>
        </MediaController>
      </div>
      {/* VIDEO INFO & COMMENTS */}
      <div
        className={classNames("row-start-2 col-start-1 max-xl:px-4 flex flex-col gap-4", {
          "mx-auto w-[40dvw]": widePlayer,
        })}>
        <div className="font-medium text-xl">{title}</div>
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
        {summary && <StreamSummary text={summary} />}
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
          "row-start-1 row-span-3": !widePlayer,
          "row-start-2": widePlayer,
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
