import "./live-chat.css";
import { EventKind, NostrLink, TaggedRawEvent, EventPublisher, parseZap } from "@snort/system";
import { useState } from "react";

import { System } from "index";
import { useLiveChatFeed } from "hooks/live-chat";
import AsyncButton from "./async-button";
import { Profile } from "./profile";
import { Icon } from "./icon";
import { Text } from "./text";
import Spinner from "./spinner";
import { useLogin } from "hooks/login";
import { useUserProfile } from "@snort/system-react";
import { formatSats, formatShort } from "number";

export interface LiveChatOptions {
  canWrite?: boolean,
  showHeader?: boolean
}

export function LiveChat({ link, options }: { link: NostrLink, options?: LiveChatOptions }) {
  const [chat, setChat] = useState("");
  const messages = useLiveChatFeed(link);
  const login = useLogin();

  async function sendChatMessage() {
    const pub = await EventPublisher.nip7();
    if (chat.length > 1) {
      const reply = await pub?.generic(eb => {
        return eb
          .kind(1311 as EventKind)
          .content(chat)
          .tag(["a", `${link.kind}:${link.author}:${link.id}`, "", "root"])
          .processContent();
      });
      if (reply) {
        console.debug(reply);
        System.BroadcastEvent(reply);
      }
      setChat("");
    }
  }

  function writeMessage() {
    return <>
      <div className="input">
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
    </>
  }

  return (
    <div className="live-chat">
      {(options?.showHeader ?? true) && <div className="header">
        Stream Chat
      </div>}
      <div className="messages">
        {[...(messages.data ?? [])]
          .sort((a, b) => b.created_at - a.created_at)
          .map(a => {
            switch (a.kind) {
              case 1311: {
                return <ChatMessage ev={a} link={link} key={a.id} />;
              }
              case EventKind.ZapReceipt: {
                return <ChatZap ev={a} key={a.id} />
              }
            }
            return null;
          })}
        {messages.data === undefined && <Spinner />}
      </div>
      {(options?.canWrite ?? true) && <div className="write-message">
        {login ? writeMessage() : <p>Please login to write messages!</p>}
      </div>}
    </div>
  );
}

function ChatMessage({ ev, link }: { ev: TaggedRawEvent, link: NostrLink }) {
  return (
    <div className={`message${link.author === ev.pubkey ? " streamer" : ""}`}>
      <Profile pubkey={ev.pubkey} />
      <Text ev={ev} />
    </div>
  );
}

function ChatZap({ ev }: { ev: TaggedRawEvent }) {
  const parsed = parseZap(ev, System.ProfileLoader.Cache);
  useUserProfile(System, parsed.anonZap ? undefined : parsed.sender);

  if (!parsed.valid) {
    return null;
  }
  return (
    <div className="pill">
      <div className="zap">
        <Icon name="zap" />
        <Profile pubkey={parsed.anonZap ? "" : (parsed.sender ?? "")} options={{
          showAvatar: !parsed.anonZap,
          overrideName: parsed.anonZap ? "Anonymous" : undefined
        }} />
        zapped
        &nbsp;
        {formatSats(parsed.amount)}
        &nbsp;
        sats
      </div>
      {parsed.content && <p>
        {parsed.content}
      </p>}
    </div>
  );
}