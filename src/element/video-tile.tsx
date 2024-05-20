import { Link } from "react-router-dom";
import { getName } from "./profile";
import { NostrEvent, NostrLink } from "@snort/system";
import { FormattedMessage } from "react-intl";

import { StatePill } from "./state-pill";
import { extractStreamInfo, getHost, profileLink } from "@/utils";
import { formatSats } from "@/number";
import { StreamState } from "@/const";
import Pill from "./pill";
import classNames from "classnames";
import Logo from "./logo";
import { useContentWarning } from "./nsfw";
import { useState } from "react";
import { Avatar } from "./avatar";
import { useUserProfile } from "@snort/system-react";

export function VideoTile({
  ev,
  showAuthor = true,
  showStatus = true,
}: {
  ev: NostrEvent;
  showAuthor?: boolean;
  showStatus?: boolean;
}) {
  const { title, image, status, participants, contentWarning } = extractStreamInfo(ev);
  const host = getHost(ev);
  const hostProfile = useUserProfile(host);
  const isGrownUp = useContentWarning();

  const link = NostrLink.fromEvent(ev);
  const [hasImg, setHasImage] = useState((image?.length ?? 0) > 0);
  return (
    <div className="flex flex-col gap-2">
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
        <div className="relative mb-2 aspect-video">
          {hasImg ? (
            <img
              loading="lazy"
              className="aspect-video object-cover rounded-xl"
              src={image}
              onError={() => {
                setHasImage(false);
              }}
            />
          ) : (
            <Logo className="text-white aspect-video" />
          )}
          <span className="flex flex-col justify-between absolute top-0 h-full right-4 items-end py-2">
            {showStatus && <StatePill state={status as StreamState} />}
            {participants && (
              <Pill>
                <FormattedMessage defaultMessage="{n} viewers" values={{ n: formatSats(Number(participants)) }} />
              </Pill>
            )}
          </span>
        </div>
      </Link>
      <div className="flex gap-3">
        {showAuthor && (
          <Link to={profileLink(hostProfile, host)}>
            <Avatar pubkey={host} user={hostProfile} />
          </Link>
        )}
        <div className="flex flex-col">
          <span className="font-medium">{title}</span>
          {showAuthor && <span className="text-layer-4">{getName(host, hostProfile)}</span>}
        </div>
      </div>
    </div>
  );
}
