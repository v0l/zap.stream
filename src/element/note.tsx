import "./note.css";
import { lazy } from "react";
import { type NostrEvent, NostrPrefix } from "@snort/system";
import { hexToBech32 } from "@snort/shared";

const Markdown = lazy(() => import("./markdown"));
import { ExternalIconLink } from "./external-link";
import { Profile } from "./profile";

export function Note({ ev }: { ev: NostrEvent }) {
  return (
    <div className="surface note">
      <div className="note-header">
        <Profile pubkey={ev.pubkey} />
        <ExternalIconLink
          size={24}
          className="note-link-icon"
          href={`https://snort.social/e/${hexToBech32(NostrPrefix.Event, ev.id)}`}
        />
      </div>
      <div className="note-content">
        <Markdown tags={ev.tags} content={ev.content} />
      </div>
    </div>
  );
}
