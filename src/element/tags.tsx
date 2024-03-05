import type { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

import { NostrEvent } from "@snort/system";
import { findTag, getTagValues } from "@/utils";
import { StreamState } from "@/const";
import Pill from "./pill";
import { Link } from "react-router-dom";

export function Tags({ children, max, ev }: { children?: ReactNode; max?: number; ev: NostrEvent }) {
  const status = findTag(ev, "status");
  const hashtags = getTagValues(ev.tags, "t");
  const tags = max ? hashtags.slice(0, max) : hashtags;

  return (
    <>
      {children}
      {status === StreamState.Planned && (
        <Pill>{status === StreamState.Planned ? <FormattedMessage defaultMessage="Starts " id="0hNxBy" /> : ""}</Pill>
      )}
      {tags.map(a => (
        <Link to={`/t/${encodeURIComponent(a)}`} key={a}>
          <Pill>{a}</Pill>
        </Link>
      ))}
    </>
  );
}
