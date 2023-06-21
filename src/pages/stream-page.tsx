import "./stream-page.css";
import { parseNostrLink } from "@snort/system";
import { useParams } from "react-router-dom";

import useEventFeed from "hooks/event-feed";
import { LiveVideoPlayer } from "element/live-video-player";
import { findTag } from "utils";
import { Profile } from "element/profile";
import { LiveChat } from "element/live-chat";
import AsyncButton from "element/async-button";
import { Icon } from "element/icon";

export function StreamPage() {
  const params = useParams();
  const link = parseNostrLink(params.id!);
  const thisEvent = useEventFeed(link);

  const stream = findTag(thisEvent.data, "streaming");
  const status = findTag(thisEvent.data, "status");
  const isLive = status === "live";
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
          </div>
          <div>
            <div className="flex g24">
              <Profile
                pubkey={thisEvent.data?.pubkey ?? ""}
              />
              <AsyncButton onClick={() => { }} className="btn btn-primary">
                Zap
                <Icon name="zap" size={16} />
              </AsyncButton>
            </div>
          </div>
        </div>
      </div>
      <LiveChat link={link} />
    </div>
  );
}
