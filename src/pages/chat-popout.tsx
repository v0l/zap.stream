import { useParams } from "react-router-dom";
import { NostrLink, parseNostrLink } from "@snort/system";
import { unwrap } from "@snort/shared";

import { LiveChat } from "@/element/chat/live-chat";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { findTag } from "@/utils";
import { useZapGoal } from "@/hooks/goals";

export function ChatPopout() {
  const params = useParams();
  const link = parseNostrLink(unwrap(params.id));
  const ev = useCurrentStreamFeed(link, true);
  const goal = useZapGoal(findTag(ev, "goal"));

  const chat = Boolean(new URL(window.location.href).searchParams.get("chat"));
  return (
    <div className="h-[calc(100vh-1rem)] w-screen px-2 my-2">
      {ev && <LiveChat
        ev={ev}
        link={NostrLink.fromEvent(ev)}
        canWrite={chat}
        showScrollbar={false}
        goal={goal}
        className="h-inherit"
        autoRaid={false}
      />}
    </div>
  );
}
