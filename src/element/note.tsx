import { Suspense, lazy } from "react";
import { NostrLink, TaggedNostrEvent } from "@snort/system";

const Markdown = lazy(() => import("./markdown"));
import { ExternalIconLink } from "./external-link";
import { Profile } from "./profile";
import EventReactions from "./event-reactions";

export function Note({ ev }: { ev: TaggedNostrEvent }) {
  return (
    <div className="bg-layer-2 rounded-xl px-4 py-3 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <Profile pubkey={ev.pubkey} avatarSize={30} />
        <ExternalIconLink size={24} href={`https://snort.social/${NostrLink.fromEvent(ev).encode()}`} />
      </div>
      <Suspense>
        <Markdown tags={ev.tags} content={ev.content} />
      </Suspense>
      <EventReactions ev={ev} />
    </div>
  );
}
