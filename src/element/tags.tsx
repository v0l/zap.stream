import type { ReactNode } from "react";
import moment from "moment";

import { NostrEvent } from "@snort/system";

import { StreamState } from "index";
import { findTag, getTagValues } from "utils";

export function Tags({
  children,
  max,
  ev,
}: {
  children?: ReactNode;
  max?: number;
  ev: NostrEvent;
}) {
  const status = findTag(ev, "status");
  const start = findTag(ev, "starts");
  const hashtags = getTagValues(ev.tags, "t");
  const tags = max ? hashtags.slice(0, max) : hashtags;

  return (
    <>
      {children}
      {status === StreamState.Planned && (
        <span className="pill">
          {status === StreamState.Planned ? "Starts " : ""}
          {moment(Number(start) * 1000).fromNow()}
        </span>
      )}
      {tags.map((a) => (
        <a href={`/t/${encodeURIComponent(a)}`} className="pill" key={a}>
          {a}
        </a>
      ))}
    </>
  );
}
