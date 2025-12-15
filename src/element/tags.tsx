import type { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

import type { NostrEvent } from "@snort/system";
import { extractStreamInfo } from "@/utils";
import { StreamState } from "@/const";
import Pill from "./pill";
import { Link } from "react-router";

export function Tags({ children, max, ev }: { children?: ReactNode; max?: number; ev: NostrEvent }) {
  const { status, tags } = extractStreamInfo(ev);
  return (
    <>
      {children}
      {status === StreamState.Planned && (
        <Pill>{status === StreamState.Planned ? <FormattedMessage defaultMessage="Starts " id="0hNxBy" /> : ""}</Pill>
      )}
      {tags.slice(0, max ? max : tags.length).map(a => (
        <Link to={`/t/${encodeURIComponent(a)}`} key={a}>
          <Pill>{a}</Pill>
        </Link>
      ))}
    </>
  );
}
