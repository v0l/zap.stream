import { useParams } from "react-router-dom";
import { NostrPrefix, encodeTLV, parseNostrLink } from "@snort/system";
import { unwrap } from "@snort/shared";

import { LiveChat } from "@/element/live-chat";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { findTag } from "@/utils";
import { useZapGoal } from "@/hooks/goals";

export function ChatPopout() {
  const params = useParams();
  const link = parseNostrLink(unwrap(params.id));
  const ev = useCurrentStreamFeed(link, true);
  const goal = useZapGoal(findTag(ev, "goal"));

  const lnk = parseNostrLink(encodeTLV(NostrPrefix.Address, findTag(ev, "d") ?? "", undefined, ev?.kind, ev?.pubkey));
  const chat = Boolean(new URL(window.location.href).searchParams.get("chat"));
  return (
    <div className="h-[calc(100dvh-1rem)] w-screen px-2 my-2">
      <LiveChat
        ev={ev}
        link={lnk}
        canWrite={chat}
        showHeader={false}
        showScrollbar={false}
        goal={goal}
        className="h-inherit"
        autoRaid={false}
      />
    </div>
  );
}
