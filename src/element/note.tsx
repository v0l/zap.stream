import "./note.css";
import { type NostrEvent } from "@snort/system";

import { Markdown } from "element/markdown";
import { Profile } from "element/profile";

export function Note({ ev }: { ev: NostrEvent }) {
  return (
    <div className="note">
      <div className="note-header">
        <Profile avatarClassname="note-avatar" pubkey={ev.pubkey} />
      </div>
      <div className="note-content">
        <Markdown tags={ev.tags}>{ev.content}</Markdown>
      </div>
    </div>
  );
}
