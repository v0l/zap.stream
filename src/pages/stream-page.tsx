import "./stream-page.css";
import { parseNostrLink, EventPublisher } from "@snort/system";
import { useNavigate, useParams } from "react-router-dom";

import useEventFeed from "hooks/event-feed";
import { LiveVideoPlayer } from "element/live-video-player";
import { findTag } from "utils";
import { Profile, getName } from "element/profile";
import { LiveChat } from "element/live-chat";
import AsyncButton from "element/async-button";
import { useLogin } from "hooks/login";
import { StreamState, System } from "index";
import { SendZapsDialog } from "element/send-zap";
import type { NostrLink } from "@snort/system";
import { useUserProfile } from "@snort/system-react";
import { NewStreamDialog } from "element/new-stream";
import { Tags } from "element/tags";
import { StatePill } from "element/state-pill";

function ProfileInfo({ link }: { link: NostrLink }) {
  const thisEvent = useEventFeed(link, true);
  const login = useLogin();
  const navigate = useNavigate();
  const host =
    thisEvent.data?.tags.find((a) => a[0] === "p" && a[3] === "host")?.[1] ??
    thisEvent.data?.pubkey;
  const profile = useUserProfile(System, host);
  const zapTarget = profile?.lud16 ?? profile?.lud06;

  const status = thisEvent?.data ? findTag(thisEvent.data, "status") : "";
  const isMine = link.author === login?.pubkey;

  async function deleteStream() {
    const pub = await EventPublisher.nip7();
    if (pub && thisEvent.data) {
      const ev = await pub.delete(thisEvent.data.id);
      console.debug(ev);
      System.BroadcastEvent(ev);
      navigate("/");
    }
  }

  return (
    <>
      <div className="flex info">
        <div className="f-grow stream-info">
          <h1>{findTag(thisEvent.data, "title")}</h1>
          <p>{findTag(thisEvent.data, "summary")}</p>
          <StatePill state={status as StreamState} />
          {thisEvent?.data && <Tags ev={thisEvent.data} />}
          {isMine && (
            <div className="actions">
              {thisEvent.data && (
                <NewStreamDialog text="Edit" ev={thisEvent.data} />
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
          {zapTarget && thisEvent.data && (
            <SendZapsDialog
              lnurl={zapTarget}
              pubkey={host}
              aTag={`${thisEvent.data.kind}:${thisEvent.data.pubkey}:${findTag(
                thisEvent.data,
                "d"
              )}`}
              targetName={getName(thisEvent.data.pubkey, profile)}
            />
          )}
        </div>
      </div>
    </>
  );
}

function VideoPlayer({ link }: { link: NostrLink }) {
  const thisEvent = useEventFeed(link);
  const stream = findTag(thisEvent.data, "streaming");
  const image = findTag(thisEvent.data, "image");

  return (
    <div className="video-content">
      <LiveVideoPlayer stream={stream} autoPlay={true} poster={image} />
    </div>
  );
}

export function StreamPage() {
  const params = useParams();
  const link = parseNostrLink(params.id!);

  return (
    <>
      <VideoPlayer link={link} />
      <ProfileInfo link={link} />
      <LiveChat link={link} />
    </>
  );
}
