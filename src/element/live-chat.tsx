import "./live-chat.css";
import {
  EventKind,
  NostrLink,
  TaggedRawEvent,
  EventPublisher,
  ParsedZap,
  parseZap,
} from "@snort/system";
import { useState, useMemo, type KeyboardEvent, type ChangeEvent } from "react";

import useEmoji from "hooks/emoji";
import { System } from "index";
import { useLiveChatFeed } from "hooks/live-chat";
import AsyncButton from "./async-button";
import { Profile } from "./profile";
import { Icon } from "./icon";
import { Text } from "./text";
import { Textarea } from "./textarea";
import Spinner from "./spinner";
import { useLogin } from "hooks/login";
import { useUserProfile } from "@snort/system-react";
import { formatSats } from "number";

export interface LiveChatOptions {
  canWrite?: boolean;
  showHeader?: boolean;
}

function totalZapped(pubkey: string, zaps: ParsedZap[]) {
  return zaps
    .filter((z) => (z.anonZap ? pubkey === "anon" : z.sender === pubkey))
    .reduce((acc, z) => acc + z.amount, 0);
}

function TopZappers({ zaps }: { zaps: ParsedZap[] }) {
  const zappers = zaps
    .map((z) => (z.anonZap ? "anon" : z.sender))
    .map((p) => p as string);

  const sortedZappers = useMemo(() => {
    const sorted = [...new Set([...zappers])];
    sorted.sort((a, b) => totalZapped(b, zaps) - totalZapped(a, zaps));
    return sorted;
  }, [zappers]);

  return (
    <>
      <h3>Top zappers</h3>
      <div className="top-zappers-container">
        {sortedZappers.map((pk, idx) => {
          const total = totalZapped(pk, zaps);
          return (
            <div className="top-zapper" key={pk}>
              {pk === "anon" ? (
                <p className="top-zapper-name">Anon</p>
              ) : (
                <Profile pubkey={pk} options={{ showName: false }} />
              )}
              <Icon name="zap" className="top-zapper-icon" />
              <p className="top-zapper-amount">{formatSats(total)}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function LiveChat({
  link,
  options,
}: {
  link: NostrLink;
  options?: LiveChatOptions;
}) {
  const messages = useLiveChatFeed(link);
  const login = useLogin();
  const events = messages.data ?? [];
  const zaps = events
    .filter((ev) => ev.kind === EventKind.ZapReceipt)
    .map((ev) => parseZap(ev, System.ProfileLoader.Cache))
    .filter((z) => z && z.valid);
  return (
    <div className="live-chat">
      {(options?.showHeader ?? true) && (
        <div className="header">Stream Chat</div>
      )}
      {zaps.length > 0 && (
        <div className="top-zappers">
          <TopZappers zaps={zaps} />
        </div>
      )}
      <div className="messages">
        {[...(messages.data ?? [])]
          .sort((a, b) => b.created_at - a.created_at)
          .map((a) => {
            switch (a.kind) {
              case 1311: {
                return <ChatMessage ev={a} link={link} key={a.id} />;
              }
              case EventKind.ZapReceipt: {
                return <ChatZap ev={a} key={a.id} />;
              }
            }
            return null;
          })}
        {messages.data === undefined && <Spinner />}
      </div>
      {(options?.canWrite ?? true) && (
        <div className="write-message">
          {login ? (
            <WriteMessage link={link} />
          ) : (
            <p>Please login to write messages!</p>
          )}
        </div>
      )}
    </div>
  );
}

function ChatMessage({ ev, link }: { ev: TaggedRawEvent; link: NostrLink }) {
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
        <Profile
          pubkey={parsed.anonZap ? "" : parsed.sender ?? ""}
          options={{
            showAvatar: !parsed.anonZap,
            overrideName: parsed.anonZap ? "Anon" : undefined,
          }}
        />
        zapped &nbsp;
        {formatSats(parsed.amount)}
        &nbsp; sats
      </div>
      {parsed.content && <p>{parsed.content}</p>}
    </div>
  );
}

function WriteMessage({ link }: { link: NostrLink }) {
  const [chat, setChat] = useState("");
  const login = useLogin();
  const userEmojis = useEmoji(login!.pubkey);
  const channelEmojis = useEmoji(link.author!);
  const emojis = userEmojis.concat(channelEmojis);
  const names = emojis.map((t) => t.at(1));

  async function sendChatMessage() {
    const pub = await EventPublisher.nip7();
    if (chat.length > 1) {
      let messageEmojis: string[][] = [];
      for (const name of names) {
        if (chat.includes(`:${name}:`)) {
          const e = emojis.find((t) => t.at(1) === name);
          messageEmojis.push(e as string[]);
        }
      }
      const reply = await pub?.generic((eb) => {
        eb.kind(1311 as EventKind)
          .content(chat)
          .tag(["a", `${link.kind}:${link.author}:${link.id}`, "", "root"])
          .processContent();
        for (const e of messageEmojis) {
          eb.tag(e);
        }
        return eb;
      });
      if (reply) {
        console.debug(reply);
        System.BroadcastEvent(reply);
      }
      setChat("");
    }
  }

  async function onKeyDown(e: KeyboardEvent) {
    if (e.code === "Enter") {
      e.preventDefault();
      await sendChatMessage();
    }
  }

  async function onChange(e: ChangeEvent) {
    // @ts-expect-error
    setChat(e.target.value);
  }

  return (
    <>
      <div className="input">
        <Textarea
          emojis={emojis}
          value={chat}
          onKeyDown={onKeyDown}
          onChange={onChange}
        />
        <Icon name="message" size={15} />
      </div>
      <AsyncButton onClick={sendChatMessage} className="btn btn-border">
        Send
      </AsyncButton>
    </>
  );
}
