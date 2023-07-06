import "./stream-page.css";
import { parseNostrLink, EventPublisher } from "@snort/system";
import { useNavigate, useParams } from "react-router-dom";

import useEventFeed from "hooks/event-feed";
import { LiveVideoPlayer } from "element/live-video-player";
import { findTag, getHost } from "utils";
import { Profile, getName } from "element/profile";
import { LiveChat } from "element/live-chat";
import AsyncButton from "element/async-button";
import { useLogin } from "hooks/login";
import { StreamState, System } from "index";
import { SendZapsDialog } from "element/send-zap";
import { NostrEvent } from "@snort/system";
import { useUserProfile } from "@snort/system-react";
import { NewStreamDialog } from "element/new-stream";
import { Tags } from "element/tags";
import { StatePill } from "element/state-pill";
import { formatSats } from "number";
import { StreamTimer } from "element/stream-time";

function ProfileInfo({ ev }: { ev?: NostrEvent }) {
  const login = useLogin();
  const navigate = useNavigate();
  const host = getHost(ev);
  const profile = useUserProfile(System, host);
  const zapTarget = profile?.lud16 ?? profile?.lud06;

  const status = findTag(ev, "status") ?? "";
  const isMine = ev?.pubkey === login?.pubkey;

  async function deleteStream() {
    const pub = await EventPublisher.nip7();
    if (pub && ev) {
      const evDelete = await pub.delete(ev.id);
      console.debug(evDelete);
      System.BroadcastEvent(evDelete);
      navigate("/");
    }
  }

  const viewers = Number(findTag(ev, "current_participants") ?? "0");
  return (
    <>
      <div className="flex info">
        <div className="f-grow stream-info">
          <h1>{findTag(ev, "title")}</h1>
          <p>{findTag(ev, "summary")}</p>
          {ev && (
            <Tags ev={ev}>
              <StatePill state={status as StreamState} />
              {viewers > 0 && <span className="pill viewers">{formatSats(viewers)} viewers</span>}
              {status === StreamState.Live && <span className="pill"><StreamTimer ev={ev} /></span>}
            </Tags>
          )}
          {isMine && (
            <div className="actions">
              {ev && (
                <NewStreamDialog text="Edit" ev={ev} btnClassName="btn"/>
              )}
              <AsyncButton
                type="button"
                className="btn btn-red"
                onClick={deleteStream}
              >
                Delete
              </AsyncButton>
            </div>
          )}
        </div>
        <div className="profile-info flex g24">
          <Profile pubkey={host ?? ""} />
          {zapTarget && ev && (
            <SendZapsDialog
              lnurl={zapTarget}
              pubkey={host}
              aTag={`${ev.kind}:${ev.pubkey}:${findTag(
                ev,
                "d"
              )}`}
              targetName={getName(ev.pubkey, profile)}
            />
          )}
        </div>
      </div>
    </>
  );
}

function VideoPlayer({ ev }: { ev?: NostrEvent }) {
  const stream = findTag(ev, "streaming");
  const image = findTag(ev, "image");
  const status = findTag(ev, "status");

  return (
    <div className="video-content">
      <LiveVideoPlayer stream={stream} poster={image} status={status} />
    </div>
  );
}

export function StreamPage() {
  const params = useParams();
  const link = parseNostrLink(params.id!);
  const { data: ev } = useEventFeed(link, true);

  return (
    <>
      <VideoPlayer ev={ev} />
      <ProfileInfo ev={ev} />
      <LiveChat link={link} />
    </>
  );
}
