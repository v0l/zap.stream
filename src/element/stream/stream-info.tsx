import { StreamState } from "@/const"
import { useLogin } from "@/hooks/login"
import { formatSats } from "@/number"
import { getHost, extractStreamInfo, findTag } from "@/utils"
import { NostrLink, type TaggedNostrEvent } from "@snort/system"
import { SnortContext, useUserProfile } from "@snort/system-react"
import { useContext } from "react"
import { FormattedMessage, useIntl } from "react-intl"
import { Link, useNavigate } from "react-router"
import { Layer2Button, WarningButton } from "../buttons"
import { FollowButton } from "../follow-button"
import GameInfoCard from "../game-info"
import { NewStreamDialog } from "../new-stream"
import { NotificationsButton } from "./notifications-button"
import Pill from "../pill"
import { Profile, getName } from "../profile"
import { SendZapsDialog } from "../send-zap"
import { ShareMenu } from "../share-menu"
import { StreamTimer } from "./stream-time"
import { Tags } from "../tags"
import { useStream } from "./stream-state"
import { StreamSummary } from "./summary"
import { Icon } from "../icon"

export function StreamInfo({ ev, goal }: { ev?: TaggedNostrEvent; goal?: TaggedNostrEvent }) {
  const system = useContext(SnortContext)
  const login = useLogin()
  const navigate = useNavigate()
  const host = ev ? getHost(ev) : undefined
  const profile = useUserProfile(host)
  const zapTarget = profile?.lud16 ?? profile?.lud06
  const streamContext = useStream()
  const { formatMessage } = useIntl()

  const { status, participants, title, summary, service, gameId, gameInfo } = extractStreamInfo(ev)
  const isMine = ev?.pubkey === login?.pubkey || host === login?.pubkey

  async function deleteStream() {
    const pub = login?.publisher()
    if (pub && ev) {
      const evDelete = await pub.delete(ev.id)
      console.debug(evDelete)
      await system.BroadcastEvent(evDelete)
      navigate("/")
    }
  }

  if (!streamContext.showDetails) {
    if (!host || !ev) return
    return (
      <div className="flex items-center gap-3">
        <Profile pubkey={host} avatarSize={36} options={{ showName: false }} />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-display font-bold leading-tight truncate">{title}</span>
          <span className="text-sm text-layer-4 truncate">
            {getName(host, profile)}
            {participants !== undefined && (
              <>
                {", "}
                <FormattedMessage defaultMessage="{n} watching" values={{ n: formatSats(Number(participants)) }} />
              </>
            )}
          </span>
        </div>
        {zapTarget && (
          <SendZapsDialog
            lnurl={zapTarget}
            pubkey={host}
            aTag={`${ev.kind}:${ev.pubkey}:${findTag(ev, "d")}`}
            eTag={goal?.id}
            targetName={getName(ev.pubkey, profile)}
          />
        )}
      </div>
    )
  }

  const isLive = status === StreamState.Live
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-sm text-layer-4">
          {isLive ? (
            <span className="inline-flex items-center gap-2 font-semibold text-text">
              <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_0_4px_rgb(255_176_0/0.22)]" />
              <FormattedMessage defaultMessage="Live now" />
            </span>
          ) : (
            status && <span className="font-semibold text-text capitalize">{status}</span>
          )}
          {participants !== undefined && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-layer-2 px-2.5 py-0.5 font-semibold text-text tabular-nums">
              <Icon name="user" size={14} className="text-primary" />
              <FormattedMessage defaultMessage="{n} watching" values={{ n: formatSats(Number(participants)) }} />
            </span>
          )}
          {isLive && <StreamTimer ev={ev} />}
          {gameInfo?.name && (
            <Link to={`/category/${gameInfo.id}`} className="hover:text-text">
              {gameInfo.name}
            </Link>
          )}
        </div>
        <h1 className="text-[clamp(22px,2.4vw,34px)] leading-tight">{title}</h1>
      </div>
      {host && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Profile pubkey={host} avatarSize={44} className="text-lg font-semibold min-w-0" />
            <FollowButton pubkey={host} hideWhenFollowing={true} />
          </div>
          <div className="flex items-center gap-2">
            {ev && (
              <>
                <ShareMenu ev={ev} />
                {service && <NotificationsButton host={host} service={service} />}
                {zapTarget && (
                  <SendZapsDialog
                    lnurl={zapTarget}
                    pubkey={host}
                    aTag={`${ev.kind}:${ev.pubkey}:${findTag(ev, "d")}`}
                    eTag={goal?.id}
                    targetName={getName(ev.pubkey, profile)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
      {(summary || (ev && extractStreamInfo(ev).tags.length > 0) || (ev?.pubkey && ev.pubkey !== host)) && (
        <div className="flex flex-col gap-3 rounded-2xl bg-layer-1 border border-layer-3 p-4">
          {summary && <StreamSummary text={summary} />}
          <div className="flex gap-2 flex-wrap items-center">
            {ev && <Tags ev={ev} />}
            {ev?.pubkey && ev?.pubkey !== host && (
              <Pill className="flex gap-2 items-center" title={formatMessage({ defaultMessage: "Stream Provider" })}>
                <Icon name="signal" className="text-primary" />
                <Profile pubkey={ev.pubkey} avatarSize={20} />
              </Pill>
            )}
          </div>
        </div>
      )}
      {gameId && (
        <div className="rounded-2xl bg-layer-1 border border-layer-3 p-3">
          <GameInfoCard
            gameId={gameId}
            gameInfo={gameInfo}
            showImage={true}
            link={true}
            imageSize={50}
            showDetail={true}
          />
        </div>
      )}
      {ev && isMine && (
        <div className="flex gap-2">
          <NewStreamDialog text={<FormattedMessage defaultMessage="Edit" />} ev={ev} />
          <Link to={`/dashboard/${NostrLink.fromEvent(ev).encode()}`}>
            <Layer2Button>
              <FormattedMessage defaultMessage="Dashboard" />
            </Layer2Button>
          </Link>
          {ev?.pubkey === login?.pubkey && (
            <WarningButton onClick={deleteStream}>
              <FormattedMessage defaultMessage="Delete" />
            </WarningButton>
          )}
        </div>
      )}
    </div>
  )
}
