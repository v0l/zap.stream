import "./live-chat.css";
import { EventKind, NostrLink, TaggedRawEvent, EventPublisher } from "@snort/system";
import { useState } from "react";

import { System } from "index";
import { useLiveChatFeed } from "hooks/live-chat";
import AsyncButton from "./async-button";
import { Profile } from "./profile";
import { Icon } from "./icon";
import Spinner from "./spinner";

export interface LiveChatOptions {
  canWrite?: boolean,
  showHeader?: boolean
}

export function LiveChat({ link, options }: { link: NostrLink, options?: LiveChatOptions }) {
  const [chat, setChat] = useState("");
  const messages = useLiveChatFeed(link);

  async function sendChatMessage() {
    const pub = await EventPublisher.nip7();
    if (chat.length > 1) {
      const reply = await pub?.generic(eb => {
        return eb
          .kind(1311 as EventKind)
          .content(chat)
          .tag(["a", `${link.kind}:${link.author}:${link.id}`])
          .processContent();
      });
      if (reply) {
        console.debug(reply);
        System.BroadcastEvent(reply);
      }
      setChat("");
    }
  }
  return (
    <div className="live-chat">
      {(options?.showHeader ?? true) && <div className="header">
        Stream Chat
      </div>}
      <div className="messages">
        {[...(messages.data ?? [])]
          .sort((a, b) => b.created_at - a.created_at)
          .map(a => (
            <ChatMessage ev={a} key={a.id} />
          ))}
        {messages.data === undefined && <Spinner />}
      </div>
      {(options?.canWrite ?? true) && <div className="write-message">
        <div>
          <input
            type="text"
            autoFocus={false}
            onChange={v => setChat(v.target.value)}
            value={chat}
            placeholder="Message"
            onKeyDown={async e => {
              if (e.code === "Enter") {
                e.preventDefault();
                await sendChatMessage();
              }
            }}
          />
          <Icon name="message" size={15} />
        </div>
        <AsyncButton onClick={sendChatMessage} className="btn btn-border">
          Send
        </AsyncButton>
      </div>}
    </div>
  );
}

function ChatMessage({ ev }: { ev: TaggedRawEvent }) {
  return (
    <div className="message">
      <Profile pubkey={ev.pubkey} />
      <span>
        {ev.content}
      </span>
    </div>
  );
}
