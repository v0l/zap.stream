import { NostrEvent, NostrLink } from "@snort/system";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";
import { getName } from "./profile";

import { StreamState } from "@/const";
import useImgProxy from "@/hooks/img-proxy";
import { formatSats } from "@/number";
import { extractStreamInfo, getHost, profileLink } from "@/utils";
import { useUserProfile } from "@snort/system-react";
import classNames from "classnames";
import { useState } from "react";
import { Avatar } from "./avatar";
import Logo from "./logo";
import { useContentWarning } from "./nsfw";
import PillOpaque from "./pill-opaque";
import { RelativeTime } from "./relative-time";
import { StatePill } from "./state-pill";
import { VideoDuration } from "./video/duration";

export function VideoTile({
  ev,
  showAuthor = true,
  showStatus = true,
  showAvatar = true,
  style,
  className,
}: {
  ev: NostrEvent;
  showAuthor?: boolean;
  showStatus?: boolean;
  showAvatar?: boolean;
  style: "list" | "grid";
  className?: string;
}) {
  const { title, image, status, participants, contentWarning, duration, recording, ends } = extractStreamInfo(ev);
  const host = getHost(ev);
  const hostProfile = useUserProfile(host);
  const isGrownUp = useContentWarning();
  const { proxy } = useImgProxy();

  const link = NostrLink.fromEvent(ev);
  const [hasImg, setHasImage] = useState((image?.length ?? 0) > 0 || (recording?.length ?? 0) > 0);
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
            "blur transition": contentWarning,
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
              src={proxy(image ?? recording ?? "")}
              onError={() => {
                setHasImage(false);
              }}
            />
          ) : (
            <Logo className="text-white aspect-video" />
          )}
          <span className="flex flex-col justify-between absolute top-0 h-full right-2 items-end py-2">
            {showStatus && <StatePill state={status as StreamState} />}
            {participants && (
              <PillOpaque>
                <FormattedMessage defaultMessage="{n} viewers" values={{ n: formatSats(Number(participants)) }} />
              </PillOpaque>
            )}
            {duration && (
              <PillOpaque>
                <VideoDuration value={duration} />
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
          <span className="font-medium" title={title}>
            {(title?.length ?? 0) > 50 ? `${title?.slice(0, 47)}...` : title}
          </span>
          {showAuthor && (
            <span className="text-layer-4">
              {getName(host, hostProfile)}
              {ends && (
                <>
                  {" · "}
                  <RelativeTime from={Number(ends) * 1000} suffix={true} />
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
