import { useParams } from "react-router";
import { parseNostrLink } from "@snort/system";
import { unwrap } from "@snort/shared";

import { LiveChat } from "@/element/chat/live-chat";
import { StreamContextProvider } from "@/element/stream/stream-state";

export function ChatPopout() {
  const params = useParams();
  const link = parseNostrLink(unwrap(params.id));

  const search = new URL(window.location.href).searchParams;
  const hashParams = new URLSearchParams(window.location.hash !== "" ? window.location.hash.substring(1) : undefined);
  const twitchToken = hashParams.get("twitch_token");
  const chat = Boolean(search.get("chat")) || Boolean(hashParams.get("chat"));
  return (
    <div className="h-[calc(100vh-1rem)] w-screen px-2 my-2">
      <StreamContextProvider link={link}>
        <LiveChat canWrite={chat} showScrollbar={false} className="h-inherit" autoRaid={false} twitchToken={twitchToken || undefined} />
      </StreamContextProvider>
    </div>
  );
}
