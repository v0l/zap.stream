import "./note.css";
import { Suspense, lazy } from "react";
import { type NostrEvent, NostrLink } from "@snort/system";

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
          href={`https://snort.social/e/${NostrLink.fromEvent(ev).encode()}`}
        />
      </div>
      <div className="note-content">
        <Suspense>
          <Markdown tags={ev.tags} content={ev.content} />
        </Suspense>
      </div>
    </div>
  );
}
