import { NostrEvent, NostrLink } from "@snort/system";
import { useUserProfile } from "@snort/system-react";
import { Link } from "react-router-dom";
import classNames from "classnames";
import { useState } from "react";

import useImgProxy from "@/hooks/img-proxy";
import { getHost, profileLink } from "@/utils";
import { Avatar } from "../avatar";
import Logo from "../logo";
import { useContentWarning } from "../nsfw";
import PillOpaque from "../pill-opaque";
import { RelativeTime } from "../relative-time";
import { VideoInfo } from "@/service/video/info";
import { VideoDuration } from "./duration";
import { getName } from "../profile";
import { useDeadLink } from "@/hooks/dead-link";

export function VideoTile({
  ev,
  showAuthor = true,
  showAvatar = true,
  style,
  className,
}: {
  ev: NostrEvent;
  showAuthor?: boolean;
  showAvatar?: boolean;
  style: "list" | "grid";
  className?: string;
}) {
  const video = VideoInfo.parse(ev);
  const host = getHost(ev);
  const hostProfile = useUserProfile(host);
  const isGrownUp = useContentWarning();
  const { proxy } = useImgProxy();

  const liveMedia = useDeadLink(ev);
  const link = NostrLink.fromEvent(ev);
  const poster = video.bestPoster();
  const bestVideo = video.bestVideo();
  const [hasImg, setHasImage] = useState(true);
  if (!liveMedia) return;
  return (
    <div
      className={classNames("flex gap-2", className, {
        "flex-col": style === "grid",
        "flex-row": style === "list",
      })}>
      <Link
        to={`/${link.encode()}`}
        className={classNames(
          {
            "blur transition": video.contentWarning !== undefined,
            "hover:blur-none": isGrownUp,
          },
          "h-full",
        )}
        state={ev}>
        <div className="h-inherit relative aspect-video bg-layer-1 rounded-xl overflow-hidden">
          {hasImg ? (
            <img
              loading="lazy"
              className="w-full h-inherit object-cover"
              src={proxy(poster?.url ?? bestVideo?.url ?? "")}
              onError={() => {
                setHasImage(false);
              }}
            />
          ) : (
            <Logo className="text-white aspect-video h-inherit mx-auto text-layer-3" width={60} />
          )}
          <span className="flex flex-col justify-between absolute top-0 h-full right-2 items-end py-2">
            {video.duration && (
              <PillOpaque>
                <VideoDuration value={video.duration} />
              </PillOpaque>
            )}
          </span>
        </div>
      </Link>
      <div className="flex gap-3">
        {showAuthor && showAvatar && (
          <Link to={profileLink(hostProfile, host)}>
            <Avatar pubkey={host} user={hostProfile} />
          </Link>
        )}
        <div className="flex flex-col break-words min-w-0">
          <span className="font-medium" title={video.title}>
            {(video.title?.length ?? 0) > 50 ? `${video.title?.slice(0, 47)}...` : video.title}
          </span>
          {showAuthor && (
            <span className="text-layer-4">
              {getName(host, hostProfile)}
              {video.publishedAt && (
                <>
                  {" · "}
                  <RelativeTime from={video.publishedAt * 1000} suffix={true} />
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
