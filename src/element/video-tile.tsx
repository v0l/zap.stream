import { Link } from "react-router-dom";
import { Profile } from "./profile";
import "./video-tile.css";
import { NostrEvent, encodeTLV, NostrPrefix } from "@snort/system";
import { useInView } from "react-intersection-observer";
import { StatePill } from "./state-pill";
import { StreamState } from "index";
import { findTag, getHost } from "utils";
import { formatSats } from "number";
import ZapStream from "../../public/zap-stream.svg";
import { isContentWarningAccepted } from "./content-warning";
import { Tags } from "element/tags";

export function VideoTile({
  ev,
  showAuthor = true,
  showStatus = true,
}: {
  ev: NostrEvent;
  showAuthor?: boolean;
  showStatus?: boolean;
}) {
  const { inView, ref } = useInView({ triggerOnce: true });
  const id = findTag(ev, "d") ?? "";
  const title = findTag(ev, "title");
  const image = findTag(ev, "image");
  const status = findTag(ev, "status");
  const viewers = findTag(ev, "current_participants");
  const contentWarning =
    findTag(ev, "content-warning") && !isContentWarningAccepted();
  const host = getHost(ev);

  const link = encodeTLV(
    NostrPrefix.Address,
    id,
    undefined,
    ev.kind,
    ev.pubkey
  );
  return (
    <div className="video-tile-container">
      <Link
        to={`/${link}`}
        className={`video-tile${contentWarning ? " nsfw" : ""}`}
        ref={ref}
        state={ev}
      >
        <div
          style={{
            backgroundImage: `url(${
              inView ? ((image?.length ?? 0) > 0 ? image : ZapStream) : ""
            })`,
          }}
        ></div>
        <span className="pill-box">
          {showStatus && <StatePill state={status as StreamState} />}
          {viewers && (
            <span className="pill viewers">
              {formatSats(Number(viewers))} viewers
            </span>
          )}
        </span>
        <h3>{title}</h3>
      </Link>
      <div className="video-tile-info">
        <div className="video-tags">
          <Tags ev={ev} max={3} />
        </div>
        {showAuthor && <div>{inView && <Profile pubkey={host} />}</div>}
      </div>
    </div>
  );
}
