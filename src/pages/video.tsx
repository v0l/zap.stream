import { Textarea } from "@/element/chat/textarea";
import { WriteMessage } from "@/element/chat/write-message";
import { FollowButton } from "@/element/follow-button";
import { Profile, getName } from "@/element/profile";
import { SendZapsDialog } from "@/element/send-zap";
import { ShareMenu } from "@/element/share-menu";
import { StreamSummary } from "@/element/stream/summary";
import VideoComments from "@/element/video/comments";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { getHost, extractStreamInfo } from "@/utils";
import { NostrLink, TaggedNostrEvent } from "@snort/system";
import { useUserProfile } from "@snort/system-react";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export function VideoPage({ link, evPreload }: { link: NostrLink; evPreload?: TaggedNostrEvent }) {
  const { formatMessage } = useIntl();
  const ev = useCurrentStreamFeed(link, true, evPreload);
  const [newComment, setNewComment] = useState("");
  const host = getHost(ev);
  const { title, summary, image, contentWarning, recording } = extractStreamInfo(ev);
  const profile = useUserProfile(host);
  const zapTarget = profile?.lud16 ?? profile?.lud06;

  return (
    <div className="p-4 w-[80dvw] mx-auto">
      <video src={recording} controls className="w-full aspect-video" poster={image} />
      <div className="grid grid-cols-[auto_450px]">
        <div className="flex flex-col gap-4">
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
      </div>
    </div>
  );
}
