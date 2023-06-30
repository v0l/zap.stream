import "./stream-page.css";
import { useRef } from "react";
import { parseNostrLink, EventPublisher } from "@snort/system";
import { useNavigate, useParams } from "react-router-dom";

import useEventFeed from "hooks/event-feed";
import { LiveVideoPlayer } from "element/live-video-player";
import { findTag } from "utils";
import { Profile, getName } from "element/profile";
import { LiveChat } from "element/live-chat";
import AsyncButton from "element/async-button";
import { useLogin } from "hooks/login";
import { System } from "index";
import { SendZapsDialog } from "element/send-zap";
import type { NostrLink } from "@snort/system";
import { useUserProfile } from "@snort/system-react";
import { NewStreamDialog } from "element/new-stream";
import { Tags } from "element/tags";

function ProfileInfo({ link }: { link: NostrLink }) {
  const thisEvent = useEventFeed(link, true);
  const login = useLogin();
  const navigate = useNavigate();
  const profile = useUserProfile(System, thisEvent.data?.pubkey);
  const zapTarget = profile?.lud16 ?? profile?.lud06;

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
          <Profile pubkey={thisEvent.data?.pubkey ?? ""} />
          {zapTarget && thisEvent.data && (
            <SendZapsDialog
              lnurl={zapTarget}
              ev={thisEvent.data}
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
  const ref = useRef(null);
  const params = useParams();
  const link = parseNostrLink(params.id!);

  return (
    <>
      <div ref={ref}></div>
      <VideoPlayer link={link} />
      <ProfileInfo link={link} />
      <LiveChat link={link} />
    </>
  );
}
