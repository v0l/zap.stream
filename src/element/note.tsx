import "./note.css";
import { type NostrEvent, NostrPrefix } from "@snort/system";

import { Markdown } from "element/markdown";
import { ExternalIconLink } from "element/external-link";
import { Profile } from "element/profile";
import { hexToBech32 } from "utils";

export function Note({ ev }: { ev: NostrEvent }) {
  return (
    <div className="surface note">
      <div className="note-header">
        <Profile avatarClassname="note-avatar" pubkey={ev.pubkey} />
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
