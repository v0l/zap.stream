import moment from "moment";
import { TaggedRawEvent } from "@snort/system";
import { StreamState } from "index";
import { findTag } from "utils";

export function Tags({ ev }: { ev: TaggedRawEvent }) {
  const status = findTag(ev, "status");
  const start = findTag(ev, "starts");
  return (
    <div className="tags">
      {status === StreamState.Planned && (
        <span className="pill">
          {status === StreamState.Planned ? "Starts " : ""}
          {moment(Number(start) * 1000).fromNow()}
        </span>
      )}
      {ev.tags
        .filter((a) => a[0] === "t")
        .map((a) => a[1])
        .map((a) => (
          <span className="pill" key={a}>
            {a}
          </span>
        ))}
    </div>
  );
}
