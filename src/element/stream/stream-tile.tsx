import { NostrEvent, NostrLink } from "@snort/system";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";
import { getName } from "../profile";

import { N94_LIVE_STREAM, NIP5_DOMAIN, StreamState } from "@/const";
import useImgProxy from "@/hooks/img-proxy";
import { formatSats } from "@/number";
import { extractStreamInfo, getHost, profileLink } from "@/utils";
import { useUserProfile } from "@snort/system-react";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { Avatar } from "../avatar";
import Logo from "../logo";
import { useContentWarning } from "../nsfw";
import PillOpaque from "../pill-opaque";
import { RelativeTime } from "../relative-time";
import { StatePill } from "../state-pill";
import { NostrJson } from "@snort/shared";

const nameCache = new Map<string, NostrJson>();
async function fetchNostrAddresByPubkey(
  pubkey: string,
  domain: string,
  timeout = 2_000,
): Promise<NostrJson | undefined> {
  if (!pubkey || !domain) {
    return undefined;
  }
  const cacheKey = `${pubkey}@${domain}`;
  if (nameCache.has(cacheKey)) {
    return nameCache.get(cacheKey);
  }
  try {
    const res = await fetch(`https://${domain}/.well-known/nostr.json?pubkey=${pubkey}`, {
      signal: AbortSignal.timeout(timeout),
    });
    const ret = (await res.json()) as NostrJson;
    nameCache.set(cacheKey, ret);

    return ret;
  } catch {
    // ignored
  }
  return undefined;
}

export function StreamTile({
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
  const { title, image, thumbnail, status, participants, contentWarning, recording, ends } = extractStreamInfo(ev);
  const host = getHost(ev);
  const link = NostrLink.fromEvent(ev);
  const hostProfile = useUserProfile(host);
  const isGrownUp = useContentWarning();
  const { proxy } = useImgProxy();
  const [videoLink, setVideoLink] = useState(`/${link.encode()}`);

  useEffect(() => {
    if (status === StreamState.Live || ev.kind === N94_LIVE_STREAM) {
      fetchNostrAddresByPubkey(host, NIP5_DOMAIN).then(h => {
        if (h) {
          const names = Object.entries(h.names);
          if (names.length > 0) {
            setVideoLink(`/${names[0][0]}`);
          }
        }
      });
    }
  }, [status, videoLink]);

  const [hasImg, setHasImage] = useState(
    (image?.length ?? 0) > 0 || (thumbnail?.length ?? 0) > 0 || (recording?.length ?? 0) > 0,
  );
  return (
    <div
      className={classNames("flex gap-2", className, {
        "flex-col": style === "grid",
        "flex-row": style === "list",
      })}>
      <Link
        to={videoLink}
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
              src={proxy(image ?? thumbnail ?? recording ?? "")}
              onError={() => {
                setHasImage(false);
              }}
            />
          ) : (
            <Logo className="text-white aspect-video h-inherit mx-auto text-layer-3" width={60} />
          )}
          <span className="flex flex-col justify-between absolute top-0 h-full right-2 items-end py-2">
            {showStatus && <StatePill state={status as StreamState} />}
            {participants && (
              <PillOpaque>
                <FormattedMessage defaultMessage="{n} viewers" values={{ n: formatSats(Number(participants)) }} />
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
            <Link to={`/${link.encode()}`} state={ev}>
              {(title?.length ?? 0) > 50 ? `${title?.slice(0, 47)}...` : title}
            </Link>
          </span>
          {showAuthor && (
            <span className="text-layer-4">
              <Link to={profileLink(hostProfile, host)} className="hover:underline">
                {getName(host, hostProfile)}
              </Link>
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
