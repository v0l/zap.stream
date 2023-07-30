import "./note.css";
import { type NostrEvent } from "@snort/system";

import { Markdown } from "element/markdown";
import { ExternalIconLink } from "element/external-link";
import { Profile } from "element/profile";

export function Note({ ev }: { ev: NostrEvent }) {
  return (
    <div className="note">
      <div className="note-header">
        <Profile avatarClassname="note-avatar" pubkey={ev.pubkey} />
        <ExternalIconLink size={25} href={`https://snort.social/e/${ev.id}`} />
      </div>
      <div className="note-content">
        <Markdown tags={ev.tags} content={ev.content} />
      </div>
    </div>
  );
}
