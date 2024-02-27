import { Link } from "react-router-dom";
import { Profile } from "./profile";
import { NostrEvent, NostrLink } from "@snort/system";
import { FormattedMessage } from "react-intl";

import { StatePill } from "./state-pill";
import { extractStreamInfo, getHost } from "@/utils";
import { formatSats } from "@/number";
import { Tags } from "./tags";
import { StreamState } from "@/const";
import Pill from "./pill";
import classNames from "classnames";
import Logo from "./logo";

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

  const link = NostrLink.fromEvent(ev);
  const hasImg = (image?.length ?? 0) > 0;
  return (
    <div className="flex flex-col gap-2">
      <Link to={`/${link.encode()}`} className={classNames({ blur: contentWarning }, "h-full")} state={ev}>
        <div className="relative mb-2 aspect-video">
          {hasImg ? (
            <img loading="lazy" className="aspect-video object-cover rounded-xl" src={image} />
          ) : (
            <Logo className="text-white aspect-video" />
          )}
          <span className="flex flex-col justify-between absolute top-0 h-full right-4 items-end py-2">
            {showStatus && <StatePill state={status as StreamState} />}
            {participants && (
              <Pill>
                <FormattedMessage
                  defaultMessage="{n} viewers"
                  id="3adEeb"
                  values={{ n: formatSats(Number(participants)) }}
                />
              </Pill>
            )}
          </span>
        </div>
        <h3>{title}</h3>
      </Link>
      <div className="flex gap-1">
        <Tags ev={ev} max={3} />
      </div>
      {showAuthor && <Profile pubkey={host} />}
    </div>
  );
}
