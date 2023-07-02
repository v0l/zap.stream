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
  useMemo,
  useRef,
  type KeyboardEvent,
  type ChangeEvent,
  type LegacyRef,
} from "react";
import { useHover } from "usehooks-ts";

import useEmoji from "hooks/emoji";
import { System } from "index";
import { useLiveChatFeed } from "hooks/live-chat";
import AsyncButton from "./async-button";
import { Profile } from "./profile";
import { Icon } from "./icon";
import { Text } from "./text";
import { Textarea } from "./textarea";
import Spinner from "./spinner";
import { SendZapsDialog } from "./send-zap";
import { useLogin } from "hooks/login";
import { useUserProfile } from "@snort/system-react";
import { formatSats } from "number";
import useTopZappers from "hooks/top-zappers";
import { LIVE_STREAM_CHAT } from "const";
import { findTag } from "utils";

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
  const feed = useLiveChatFeed(link);
  const login = useLogin();
  const zaps = feed.zaps
    .filter((ev) => ev.kind === EventKind.ZapReceipt)
    .map((ev) => parseZap(ev, System.ProfileLoader.Cache))
    .filter((z) => z && z.valid);
  const events = useMemo(() => {
    return [...feed.messages, ...feed.zaps].sort(
      (a, b) => b.created_at - a.created_at
    );
  }, [feed.messages, feed.zaps]);

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
        {events.map((a) => {
          switch (a.kind) {
            case LIVE_STREAM_CHAT: {
              return (
                <ChatMessage
                  streamer={link.author ?? ""}
                  ev={a}
                  link={link}
                  key={a.id}
                  reactions={feed.reactions}
                />
              );
            }
            case EventKind.ZapReceipt: {
              return <ChatZap streamer={link.author ?? ""} ev={a} key={a.id} />;
            }
          }
          return null;
        })}
        {feed.messages.length === 0 && <Spinner />}
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

function emojifyReaction(reaction: string) {
  if (reaction === "+") {
    return "💜";
  }
  if (reaction === "-") {
    return "👎";
  }
  return reaction;
}

function ChatMessage({
  streamer,
  ev,
  link,
  reactions,
}: {
  streamer: string;
  ev: TaggedRawEvent;
  link: NostrLink;
  reactions: readonly TaggedRawEvent[];
}) {
  const ref = useRef(null);
  const isHovering = useHover(ref);
  const profile = useUserProfile(System, ev.pubkey);
  const zapTarget = profile?.lud16 ?? profile?.lud06;
  const zaps = reactions
    .filter((ev) => ev.kind === EventKind.ZapReceipt)
    .map((ev) => parseZap(ev, System.ProfileLoader.Cache))
    .filter((z) => z && z.valid);
  const emojis = useMemo(() => {
    const emojified = reactions
      .filter((e) => e.kind === EventKind.Reaction && findTag(e, "e") === ev.id)
      .map((ev) => emojifyReaction(ev.content));
    return [...new Set(emojified)];
  }, [ev, reactions]);
  const hasReactions = emojis.length > 0;
  const totalZaps = useMemo(() => {
    const messageZaps = zaps.filter((z) => z.event === ev.id);
    return messageZaps.reduce((acc, z) => acc + z.amount, 0);
  }, [reactions, ev]);
  const hasZaps = totalZaps > 0;
  return (
    <>
      <div
        className={`message${link.author === ev.pubkey ? " streamer" : ""}`}
        ref={ref}
      >
        {zapTarget && (
          <SendZapsDialog
            lnurl={zapTarget}
            aTag={
              streamer === ev.pubkey
                ? `${link.kind}:${link.author}:${link.id}`
                : undefined
            }
            eTag={ev.id}
            pubkey={ev.pubkey}
            button={
              isHovering ? (
                <div className="message-zap-container">
                  <button className="message-zap-button">
                    <Icon
                      name="zap-filled"
                      className="message-zap-button-icon"
                    />
                  </button>
                </div>
              ) : (
                <></>
              )
            }
            targetName={profile?.name || ev.pubkey}
          />
        )}
        <Profile pubkey={ev.pubkey} />
        <Text content={ev.content} tags={ev.tags} />
        {(hasReactions || hasZaps) && (
          <div className="message-reactions">
            {hasZaps && (
              <div className="zap-pill">
                <Icon name="zap-filled" className="zap-pill-icon" />
                <span className="zap-pill-amount">{formatSats(totalZaps)}</span>
              </div>
            )}
            {emojis.map((e) => (
              <span className="message-reaction">{e}</span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ChatZap({ streamer, ev }: { streamer: string; ev: TaggedRawEvent }) {
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

  return parsed.receiver === streamer ? (
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
  ) : null;
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
        eb.kind(LIVE_STREAM_CHAT as EventKind)
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
