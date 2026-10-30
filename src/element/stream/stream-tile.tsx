import type { NostrEvent } from "@snort/system"
import { FormattedMessage, useIntl } from "react-intl"
import { Link } from "react-router"
import { getName } from "../profile"

import { StreamState } from "@/const"
import { useStreamHref } from "@/hooks/short-link"
import useImgProxy from "@/hooks/img-proxy"
import { formatSats, formatSatsCompact } from "@/number"
import { extractStreamInfo, getHost, profileLink } from "@/utils"
import { youtubeThumbnailUrl } from "@/youtube"
import { useUserProfile } from "@snort/system-react"
import classNames from "classnames"
import { type ReactNode, useState } from "react"
import { Avatar } from "../avatar"
import Logo from "../logo"
import { useContentWarning } from "../nsfw"
import { Icon } from "../icon"
import { RelativeTime } from "../relative-time"

export function StreamTile({
  ev,
  showAuthor = true,
  showStatus = true,
  showAvatar = true,
  style,
  className,
  zapTotal,
}: {
  ev: NostrEvent
  showAuthor?: boolean
  showStatus?: boolean
  showAvatar?: boolean
  style: "list" | "grid"
  className?: string
  zapTotal?: number
}) {
  const { formatMessage } = useIntl()
  const { title, image, thumbnail, status, participants, contentWarning, recording, ends, gameInfo } =
    extractStreamInfo(ev)
  const host = getHost(ev)
  const hostProfile = useUserProfile(host)
  const isGrownUp = useContentWarning()
  const { proxy } = useImgProxy()
  const videoLink = useStreamHref(ev, host)

  // YouTube links can't be used as an <img> src; use the video thumbnail instead
  const imgSrc = image ?? thumbnail ?? (recording ? youtubeThumbnailUrl(recording) : undefined) ?? recording ?? ""
  // track failures per-src so a late-arriving event (or a changed image) is retried
  const [failedSrc, setFailedSrc] = useState<string>()
  const hasImg = imgSrc.length > 0 && failedSrc !== imgSrc
  const isLive = status === StreamState.Live
  return (
    <div
      className={classNames("flex gap-3", className, {
        "flex-col": style === "grid",
        "flex-row": style === "list",
      })}
    >
      <Link
        to={videoLink}
        className={classNames(
          {
            "blur transition": contentWarning,
            "hover:blur-none": isGrownUp,
          },
          "h-full group",
        )}
        state={ev}
      >
        <div className="h-inherit relative aspect-video bg-layer-1 rounded-xl overflow-hidden outline-2 outline-transparent group-hover:outline-layer-3 transition-[outline-color]">
          {hasImg ? (
            <img
              loading="lazy"
              alt={title ?? ""}
              className="w-full h-inherit object-cover"
              src={proxy(imgSrc)}
              onError={() => {
                setFailedSrc(imgSrc)
              }}
            />
          ) : (
            <Logo className="aspect-video h-inherit mx-auto text-layer-3" width={60} />
          )}
          <span className="absolute inset-x-2.5 top-2.5 flex justify-between items-start gap-2">
            {showStatus && (isLive || participants) ? (
              <TileBadge>
                {isLive && <span className="w-[7px] h-[7px] rounded-full bg-primary" />}
                {participants ? (
                  <FormattedMessage defaultMessage="{n} watching" values={{ n: formatSats(Number(participants)) }} />
                ) : (
                  <FormattedMessage defaultMessage="Live" id="Dn82AL" />
                )}
              </TileBadge>
            ) : showStatus && status ? (
              <TileBadge className="capitalize">{status}</TileBadge>
            ) : (
              <span />
            )}
            {zapTotal !== undefined && zapTotal > 0 && (
              <TileBadge
                className="text-primary tabular-nums"
                title={formatMessage(
                  { defaultMessage: "{n} sats zapped in the last 24 hours" },
                  { n: zapTotal.toLocaleString() },
                )}
              >
                <Icon name="zap-filled" size={12} />
                {formatSatsCompact(zapTotal)}
              </TileBadge>
            )}
          </span>
        </div>
      </Link>
      <div className="flex gap-3 min-w-0">
        {showAuthor && showAvatar && style === "list" && (
          <Link to={profileLink(hostProfile, host)}>
            <Avatar pubkey={host} user={hostProfile} size={32} />
          </Link>
        )}
        <div className="flex flex-col gap-1 break-words min-w-0">
          <h3 className="text-[19px] leading-tight line-clamp-2" title={title}>
            <Link to={videoLink} state={ev}>
              {title}
            </Link>
          </h3>
          {showAuthor && (
            <span className="text-layer-4 text-[14.5px]">
              <Link to={profileLink(hostProfile, host)} className="text-text hover:underline">
                {getName(host, hostProfile)}
              </Link>
              {gameInfo?.name && (
                <>
                  {" "}
                  <FormattedMessage defaultMessage="in {category}" values={{ category: gameInfo.name }} />
                </>
              )}
              {ends && (
                <>
                  {", "}
                  <RelativeTime from={Number(ends) * 1000} suffix={true} />
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function TileBadge({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <span
      title={title}
      className={classNames(
        "flex items-center gap-1.5 rounded-md bg-layer-0/80 px-2 py-0.5 text-[13px] font-semibold backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </span>
  )
}
