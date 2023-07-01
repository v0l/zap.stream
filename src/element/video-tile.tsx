import { Link } from "react-router-dom";
import { Profile } from "./profile";
import "./video-tile.css";
import { NostrEvent, encodeTLV, NostrPrefix } from "@snort/system";
import { useInView } from "react-intersection-observer";
import { StatePill } from "./state-pill";
import { StreamState } from "index";

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
  const id = ev.tags.find((a) => a[0] === "d")?.[1]!;
  const title = ev.tags.find((a) => a[0] === "title")?.[1];
  const image = ev.tags.find((a) => a[0] === "image")?.[1];
  const status = ev.tags.find((a) => a[0] === "status")?.[1];
  const host =
    ev.tags.find((a) => a[0] === "p" && a[3] === "host")?.[1] ?? ev.pubkey;

  const link = encodeTLV(
    NostrPrefix.Address,
    id,
    undefined,
    ev.kind,
    ev.pubkey
  );
  return (
    <Link to={`/live/${link}`} className="video-tile" ref={ref}>
      <div
        style={{
          backgroundImage: `url(${inView ? image : ""})`,
        }}
      >
        {showStatus && <StatePill state={status as StreamState} />}
      </div>
      <h3>{title}</h3>
      {showAuthor && <div>{inView && <Profile pubkey={host} />}</div>}
    </Link>
  );
}
