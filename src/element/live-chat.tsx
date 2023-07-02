import "./live-chat.css";
import {
  EventKind,
  NostrLink,
  TaggedRawEvent,
  EventPublisher,
  ParsedZap,
  parseZap,
} from "@snort/system";
import {
  useState,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";

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
import useTopZappers from "hooks/top-zappers";

export interface LiveChatOptions {
  canWrite?: boolean;
  showHeader?: boolean;
}

function TopZappers({ zaps }: { zaps: ParsedZap[] }) {
  const zappers = useTopZappers(zaps).slice(0, 3);

  return (
    <>
      <h3>Top zappers</h3>
      <div className="top-zappers-container">
        {zappers.map(({ pubkey, total }, idx) => {
          return (
            <div className="top-zapper" key={pubkey}>
              {pubkey === "anon" ? (
                <p className="top-zapper-name">Anon</p>
              ) : (
                <Profile pubkey={pubkey} options={{ showName: false }} />
              )}
              <Icon name="zap-filled" className="zap-icon" />
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
  height,
}: {
  link: NostrLink;
  options?: LiveChatOptions;
  height?: number;
}) {
  const messages = useLiveChatFeed(link);
  const login = useLogin();
  const events = messages.data ?? [];
  const zaps = events
    .filter((ev) => ev.kind === EventKind.ZapReceipt)
    .map((ev) => parseZap(ev, System.ProfileLoader.Cache))
    .filter((z) => z && z.valid);
  return (
    <div className="live-chat" style={height ? { height: `${height}px` } : {}}>
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
      <Text content={ev.content} tags={ev.tags} />
    </div>
  );
}

function ChatZap({ ev }: { ev: TaggedRawEvent }) {
  const parsed = parseZap(ev, System.ProfileLoader.Cache);
  useUserProfile(System, parsed.anonZap ? undefined : parsed.sender);

  useEffect(() => {
    if (
      !parsed.valid &&
      parsed.errors.includes("zap service pubkey doesn't match") &&
      parsed.sender
    ) {
      System.ProfileLoader.TrackMetadata(parsed.sender);
      return () =>
        System.ProfileLoader.UntrackMetadata(parsed.sender as string);
    }
  }, [parsed]);

  if (!parsed.valid) {
    return null;
  }
  return (
    <div className="zap-container">
      <div className="zap">
        <Icon name="zap-filled" className="zap-icon" />
        <Profile
          pubkey={parsed.anonZap ? "anon" : parsed.sender ?? "anon"}
          options={{
            showAvatar: !parsed.anonZap,
            overrideName: parsed.anonZap ? "Anon" : undefined,
          }}
        />
        zapped
        <span className="zap-amount">{formatSats(parsed.amount)}</span>
        sats
      </div>
      {parsed.content && <div className="zap-content">{parsed.content}</div>}
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
      let emojiNames = new Set();

      for (const name of names) {
        if (chat.includes(`:${name}:`)) {
          emojiNames.add(name);
        }
      }

      const reply = await pub?.generic((eb) => {
        const emoji = [...emojiNames].map((name) =>
          emojis.find((e) => e.at(1) === name)
        );
        eb.kind(1311 as EventKind)
          .content(chat)
          .tag(["a", `${link.kind}:${link.author}:${link.id}`, "", "root"])
          .processContent();
        for (const e of emoji) {
          if (e) {
            eb.tag(e);
          }
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
      <div className="paper">
        <Textarea
          emojis={emojis}
          value={chat}
          onKeyDown={onKeyDown}
          onChange={onChange}
        />
      </div>
      <AsyncButton onClick={sendChatMessage} className="btn btn-border">
        Send
      </AsyncButton>
    </>
  );
}
