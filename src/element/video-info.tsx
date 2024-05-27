import { FollowButton } from "./follow-button";
import { Profile, getName } from "./profile";
import { SendZapsDialog } from "./send-zap";
import { ShareMenu } from "./share-menu";
import { useVideoPlayerContext } from "./video/context";
import { getHost } from "@/utils";
import { useUserProfile } from "@snort/system-react";
import { NostrLink } from "@snort/system";
import { StreamSummary } from "./stream/summary";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import { WriteMessage } from "./chat/write-message";
import VideoComments from "./video/comments";

export function VideoInfo({
  showComments,
  showShare,
  showZap,
}: {
  showComments?: boolean;
  showShare?: boolean;
  showZap?: boolean;
}) {
  const ctx = useVideoPlayerContext();
  const ev = ctx.event;
  const link = NostrLink.fromEvent(ev);
  const host = getHost(ctx.event);
  const profile = useUserProfile(host);
  const zapTarget = profile?.lud16 ?? profile?.lud06;

  return (
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
              {(showShare ?? true) && <ShareMenu ev={ev} />}
              {(showZap ?? true) && zapTarget && (
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
      {(showComments ?? true) && (
        <>
          <h3>
            <FormattedMessage defaultMessage="Comments" />
          </h3>
          <div>
            <WriteMessage link={link} emojiPacks={[]} kind={1} />
          </div>
          <VideoComments link={link} />
        </>
      )}
    </div>
  );
}
