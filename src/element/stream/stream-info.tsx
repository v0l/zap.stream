import { StreamState } from "@/const";
import { useLogin } from "@/hooks/login";
import { formatSats } from "@/number";
import { getHost, extractStreamInfo, findTag } from "@/utils";
import { NostrLink, type TaggedNostrEvent } from "@snort/system";
import { SnortContext, useUserProfile } from "@snort/system-react";
import { useContext } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Link, useNavigate } from "react-router";
import { Layer2Button, WarningButton } from "../buttons";
import { FollowButton } from "../follow-button";
import GameInfoCard from "../game-info";
import { NewStreamDialog } from "../new-stream";
import { NotificationsButton } from "./notifications-button";
import Pill from "../pill";
import { Profile, getName } from "../profile";
import { SendZapsDialog } from "../send-zap";
import { ShareMenu } from "../share-menu";
import { StatePill } from "../state-pill";
import { StreamTimer } from "./stream-time";
import { Tags } from "../tags";
import { useStream } from "./stream-state";
import { StreamSummary } from "./summary";
import { Icon } from "../icon";

export function StreamInfo({ ev, goal }: { ev?: TaggedNostrEvent; goal?: TaggedNostrEvent }) {
  const system = useContext(SnortContext);
  const login = useLogin();
  const navigate = useNavigate();
  const host = ev ? getHost(ev) : undefined;
  const profile = useUserProfile(host);
  const zapTarget = profile?.lud16 ?? profile?.lud06;
  const streamContext = useStream();
  const { formatMessage } = useIntl();

  const { status, participants, title, summary, service, gameId, gameInfo } = extractStreamInfo(ev);
  const isMine = ev?.pubkey === login?.pubkey || host === login?.pubkey;

  async function deleteStream() {
    const pub = login?.publisher();
    if (pub && ev) {
      const evDelete = await pub.delete(ev.id);
      console.debug(evDelete);
      await system.BroadcastEvent(evDelete);
      navigate("/");
    }
  }

  if (!streamContext.showDetails) return;

  return (
    <div className="flex gap-2 max-xl:flex-col">
        <div className="grow flex flex-col gap-2">
          <div className="max-xl:text-lg xl:text-3xl font-semibold">{title}</div>
          {host && (
            <div className="flex max-xl:flex-col xl:justify-between max-xl:gap-2">
              <div className="flex gap-4 items-center flex-wrap">
                <Profile pubkey={host} avatarSize={40} />
                <FollowButton pubkey={host} hideWhenFollowing={true} />
                {participants !== undefined && (
                  <div className="flex grow justify-end xl:hidden text-nowrap">
                    <Pill>
                      <FormattedMessage defaultMessage="{n} viewers" values={{ n: formatSats(Number(participants)) }} />
                    </Pill>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
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
          <div className="flex gap-2 flex-wrap max-xl:hidden">
            <StatePill state={status as StreamState} />
            {participants !== undefined && (
              <Pill>
                <FormattedMessage defaultMessage="{n} viewers" values={{ n: formatSats(Number(participants)) }} />
              </Pill>
            )}
            {status === StreamState.Live && (
              <Pill>
                <StreamTimer ev={ev} />
              </Pill>
            )}
            {ev?.pubkey && ev?.pubkey !== host && (
              <Pill className="flex gap-2 items-center" title={formatMessage({ defaultMessage: "Stream Provider" })}>
                <Icon name="signal" className="text-primary" />
                <Profile pubkey={ev.pubkey} avatarSize={20} />
              </Pill>
            )}
            {gameId && gameInfo && (
              <Pill>
                <GameInfoCard gameId={gameId} gameInfo={gameInfo} showImage={false} link={true} />
              </Pill>
            )}
            {ev && <Tags ev={ev} />}
          </div>
          {summary && <StreamSummary text={summary} />}
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
      </div>
  );
}
