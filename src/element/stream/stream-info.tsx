import { StreamState } from "@/const";
import { useLogin } from "@/hooks/login";
import { formatSats } from "@/number";
import { getHost, extractStreamInfo, findTag } from "@/utils";
import { TaggedNostrEvent } from "@snort/system";
import { SnortContext, useUserProfile } from "@snort/system-react";
import { useContext, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";
import { WarningButton } from "../buttons";
import { ClipButton } from "./clip-button";
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

export function StreamInfo({ ev, goal }: { ev?: TaggedNostrEvent; goal?: TaggedNostrEvent }) {
  const system = useContext(SnortContext);
  const login = useLogin();
  const navigate = useNavigate();
  const host = getHost(ev);
  const profile = useUserProfile(host);
  const zapTarget = profile?.lud16 ?? profile?.lud06;
  const streamContext = useStream();

  const { status, participants, title, summary, service, gameId, gameInfo } = extractStreamInfo(ev);
  const isMine = ev?.pubkey === login?.pubkey;

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
  const viewers = Number(participants ?? "0");
  return (
    <>
      <div className="flex gap-2 max-xl:flex-col">
        <div className="grow flex flex-col gap-2">
          <div className="text-3xl font-semibold">{title}</div>
          <div className="flex max-xl:flex-col xl:justify-between max-xl:gap-2">
            <div className="flex gap-4">
              <Profile pubkey={host ?? ""} avatarSize={40} />
              <FollowButton pubkey={host} hideWhenFollowing={true} />
            </div>
            <div className="flex gap-2">
              {ev && (
                <>
                  <ClipButton ev={ev} />
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
          <div className="flex gap-2 flex-wrap max-xl:hidden">
            <StatePill state={status as StreamState} />
            <Pill>
              <FormattedMessage defaultMessage="{n} viewers" values={{ n: formatSats(viewers) }} />
            </Pill>
            {status === StreamState.Live && (
              <Pill>
                <StreamTimer ev={ev} />
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
          {isMine && (
            <div className="flex gap-4">
              {ev && <NewStreamDialog text={<FormattedMessage defaultMessage="Edit" />} ev={ev} />}
              <WarningButton onClick={deleteStream}>
                <FormattedMessage defaultMessage="Delete" />
              </WarningButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
