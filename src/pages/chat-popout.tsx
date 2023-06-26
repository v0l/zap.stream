import "./chat-popout.css";
import { LiveChat } from "element/live-chat";
import { useParams } from "react-router-dom";
import { parseNostrLink } from "@snort/system";

export function ChatPopout() {
  const params = useParams();
  const link = parseNostrLink(params.id!);

  return (
    <div className="popout-chat">
      <LiveChat
        link={link}
        options={{
          canWrite: false,
          showHeader: false,
        }}
      />
    </div>
  );
}
