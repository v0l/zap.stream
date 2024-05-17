import { StreamState } from "@/const";
import { useLogin } from "@/hooks/login";
import { formatSats } from "@/number";
import { getHost, extractStreamInfo, findTag } from "@/utils";
import { TaggedNostrEvent } from "@snort/system";
import { SnortContext, useUserProfile } from "@snort/system-react";
import { useContext, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";
import { WarningButton } from "./buttons";
import { ClipButton } from "./clip-button";
import { FollowButton } from "./follow-button";
import GameInfoCard from "./game-info";
import { NewStreamDialog } from "./new-stream";
import { NotificationsButton } from "./notifications-button";
import Pill from "./pill";
import { Profile, getName } from "./profile";
import { SendZapsDialog } from "./send-zap";
import { ShareMenu } from "./share-menu";
import { StatePill } from "./state-pill";
import { StreamTimer } from "./stream-time";
import { Tags } from "./tags";

export function StreamInfo({ ev, goal }: { ev?: TaggedNostrEvent; goal?: TaggedNostrEvent }) {
  const system = useContext(SnortContext);
  const login = useLogin();
  const navigate = useNavigate();
  const host = getHost(ev);
  const profile = useUserProfile(host);
  const zapTarget = profile?.lud16 ?? profile?.lud06;

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

  const viewers = Number(participants ?? "0");
  return (
    <>
      <div className="flex gap-2 max-xl:flex-col max-xl:px-2">
        <div className="grow flex flex-col gap-2 max-xl:hidden">
          <h1>{title}</h1>
          {summary && <StreamSummary text={summary} />}

          <div className="flex gap-2 flex-wrap">
            <StatePill state={status as StreamState} />
            <Pill>
              <FormattedMessage defaultMessage="{n} viewers" id="3adEeb" values={{ n: formatSats(viewers) }} />
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
          {isMine && (
            <div className="flex gap-4">
              {ev && <NewStreamDialog text={<FormattedMessage defaultMessage="Edit" />} ev={ev} />}
              <WarningButton onClick={deleteStream}>
                <FormattedMessage defaultMessage="Delete" />
              </WarningButton>
            </div>
          )}
        </div>
        <div className="flex justify-between sm:gap-4 max-sm:gap-2 flex-wrap max-md:flex-col lg:items-center">
          <Profile pubkey={host ?? ""} />
          <div className="flex gap-2">
            <FollowButton pubkey={host} hideWhenFollowing={true} />
            {ev && (
              <>
                <ShareMenu ev={ev} />
                <ClipButton ev={ev} />
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
      </div>
    </>
  );
}

function StreamSummary({ text }: { text: string }) {
  const [expand, setExpand] = useState(false);

  const cutOff = 100;
  const shouldExpand = text.length > cutOff;
  return (
    <div className="whitespace-pre text-pretty">
      {shouldExpand && !expand ? text.slice(0, cutOff) : text}
      {shouldExpand && "... "}
      {shouldExpand && (
        <span
          className="text-primary text-bold cursor-pointer"
          onClick={() => {
            setExpand(x => !x);
          }}>
          {expand && <FormattedMessage defaultMessage="Show Less" />}
          {!expand && <FormattedMessage defaultMessage="Show More" />}
        </span>
      )}
    </div>
  );
}
