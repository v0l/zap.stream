import "./stream-page.css";
import { useState } from "react";
import { parseNostrLink, EventPublisher } from "@snort/system";
import { useNavigate, useParams } from "react-router-dom";

import useEventFeed from "hooks/event-feed";
import { LiveVideoPlayer } from "element/live-video-player";
import { findTag } from "utils";
import { Profile, getName } from "element/profile";
import { LiveChat } from "element/live-chat";
import AsyncButton from "element/async-button";
import { Icon } from "element/icon";
import { useLogin } from "hooks/login";
import { System } from "index";
import Modal from "element/modal";
import { SendZaps } from "element/send-zap";
import { useUserProfile } from "@snort/system-react";
import { NewStream } from "element/new-stream";

export function StreamPage() {
  const params = useParams();
  const link = parseNostrLink(params.id!);
  const thisEvent = useEventFeed(link);
  const login = useLogin();
  const navigate = useNavigate();
  const [zap, setZap] = useState(false);
  const [edit, setEdit] = useState(false);
  const profile = useUserProfile(System, thisEvent.data?.pubkey);

  const stream = findTag(thisEvent.data, "streaming");
  const status = findTag(thisEvent.data, "status");
  const isLive = status === "live";
  const isMine = link.author === login?.pubkey;
  const zapTarget = profile?.lud16 ?? profile?.lud06;

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
    <div className="live-page">
      <div>
        <LiveVideoPlayer stream={stream} autoPlay={true} />
        <div className="flex info">
          <div className="f-grow">
            <h1>{findTag(thisEvent.data, "title")}</h1>
            <p>{findTag(thisEvent.data, "summary")}</p>
            <div className="tags">
              <span className={`pill${isLive ? " live" : ""}`}>
                {status}
              </span>
              {thisEvent.data?.tags
                .filter(a => a[0] === "t")
                .map(a => a[1])
                .map(a => (
                  <span className="pill" key={a}>
                    {a}
                  </span>
                ))}
            </div>
            {isMine && <div className="actions">
              <button type="button" className="btn" onClick={() => setEdit(true)}>
                Edit
              </button>
              <AsyncButton type="button" className="btn btn-red" onClick={deleteStream}>
                Delete
              </AsyncButton>
            </div>}
          </div>
          <div>
            <div className="flex g24">
              <Profile
                pubkey={thisEvent.data?.pubkey ?? ""}
              />
              <button onClick={() => setZap(true)} className="btn btn-primary zap">
                Zap
                <Icon name="zap" size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <LiveChat link={link} />
      {zap && zapTarget && thisEvent.data && <Modal onClose={() => setZap(false)}>
        <SendZaps
          lnurl={zapTarget}
          ev={thisEvent.data}
          targetName={getName(thisEvent.data.pubkey, profile)}
          onFinish={() => setZap(false)} />
      </Modal>}
      {edit && thisEvent.data && <Modal onClose={() => setEdit(false)}>
        <NewStream ev={thisEvent.data} onFinish={() => window.location.reload()} />
      </Modal>}
    </div>
  );
}
