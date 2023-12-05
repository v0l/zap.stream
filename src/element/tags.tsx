import type { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

import { NostrEvent } from "@snort/system";

import { StreamState } from "@/index";
import { findTag, getTagValues } from "@/utils";

export function Tags({ children, max, ev }: { children?: ReactNode; max?: number; ev: NostrEvent }) {
  const status = findTag(ev, "status");
  const hashtags = getTagValues(ev.tags, "t");
  const tags = max ? hashtags.slice(0, max) : hashtags;

  return (
    <>
      {children}
      {status === StreamState.Planned && (
        <span className="pill bg-gray-1">
          {status === StreamState.Planned ? <FormattedMessage defaultMessage="Starts " id="0hNxBy" /> : ""}
        </span>
      )}
      {tags.map(a => (
        <a href={`/t/${encodeURIComponent(a)}`} className="pill bg-gray-1" key={a}>
          {a}
        </a>
      ))}
    </>
  );
}
