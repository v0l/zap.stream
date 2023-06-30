import { Link } from "react-router-dom";
import { Profile } from "./profile";
import "./video-tile.css";
import { NostrEvent, encodeTLV, NostrPrefix } from "@snort/system";
import { useInView } from "react-intersection-observer";

export function VideoTile({ ev }: { ev: NostrEvent }) {
    const { inView, ref } = useInView({ triggerOnce: true });
    const id = ev.tags.find(a => a[0] === "d")?.[1]!;
    const title = ev.tags.find(a => a[0] === "title")?.[1];
    const image = ev.tags.find(a => a[0] === "image")?.[1];
    const status = ev.tags.find(a => a[0] === "status")?.[1];
    const isLive = status === "live";

    const link = encodeTLV(NostrPrefix.Address, id, undefined, ev.kind, ev.pubkey);
    return <Link to={`/${link}`} className="video-tile" ref={ref}>
        <div style={{
            backgroundImage: `url(${inView ? image : ""})`
        }}>
            <span className={`pill${isLive ? " live" : ""}`}>
                {status}
            </span>
        </div>
        <h3>{title}</h3>
        <div>
            {inView && <Profile pubkey={ev.pubkey} />}
        </div>
    </Link>
}