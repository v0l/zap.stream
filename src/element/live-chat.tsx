import "./live-chat.css";
import {
  EventKind,
  NostrPrefix,
  NostrLink,
  ParsedZap,
  NostrEvent,
  parseZap,
  encodeTLV,
} from "@snort/system";
import { useEffect, useMemo } from "react";
import uniqBy from "lodash.uniqby";

import { System } from "../index";
import useEmoji, { packId } from "../hooks/emoji";
import { useLiveChatFeed } from "../hooks/live-chat";
import { Profile } from "./profile";
import { Icon } from "./icon";
import Spinner from "./spinner";
import { useLogin } from "../hooks/login";
import { formatSats } from "../number";
import useTopZappers from "../hooks/top-zappers";
import { LIVE_STREAM_CHAT } from "../const";
import { ChatMessage } from "./chat-message";
import { Goal } from "./goal";
import { NewGoalDialog } from "./new-goal";
import { WriteMessage } from "./write-message";
import { findTag, getHost } from "utils";

export interface LiveChatOptions {
  canWrite?: boolean;
  showHeader?: boolean;
}

function TopZappers({ zaps }: { zaps: ParsedZap[] }) {
  const zappers = useTopZappers(zaps);

  return (
    <>
      {zappers.map(({ pubkey, total }) => {
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
    </>
  );
}

export function LiveChat({
  link,
  ev,
  goal,
  options,
  height,
}: {
  link: NostrLink;
  ev?: NostrEvent;
  goal?: NostrEvent;
  options?: LiveChatOptions;
  height?: number;
}) {
  const host = getHost(ev);
  const feed = useLiveChatFeed(link, goal ? [goal.id] : undefined);
  const login = useLogin();
  useEffect(() => {
    const pubkeys = [
      ...new Set(feed.zaps.flatMap((a) => [a.pubkey, findTag(a, "p")!])),
    ];
    System.ProfileLoader.TrackMetadata(pubkeys);
    return () => System.ProfileLoader.UntrackMetadata(pubkeys);
  }, [feed.zaps]);

  const userEmojiPacks = useEmoji(login?.pubkey);
  const channelEmojiPacks = useEmoji(host);
  const allEmojiPacks = useMemo(() => {
    return uniqBy(channelEmojiPacks.concat(userEmojiPacks), packId);
  }, [userEmojiPacks, channelEmojiPacks]);

  const zaps = feed.zaps
    .map((ev) => parseZap(ev, System.ProfileLoader.Cache))
    .filter((z) => z && z.valid);

  const goalZaps = feed.zaps
    .filter((ev) =>
      goal
        ? ev.created_at > goal.created_at &&
          ev.tags.some((t) => t[0] === "e" && t[1] === goal.id)
        : false
    )
    .map((ev) => parseZap(ev, System.ProfileLoader.Cache))
    .filter((z) => z && z.valid);

  const events = useMemo(() => {
    return [...feed.messages, ...feed.zaps].sort(
      (a, b) => b.created_at - a.created_at
    );
  }, [feed.messages, feed.zaps]);
  const streamer = getHost(ev);
  const naddr = useMemo(() => {
    if (ev) {
      return encodeTLV(
        NostrPrefix.Address,
        findTag(ev, "d") ?? "",
        undefined,
        ev.kind,
        ev.pubkey
      );
    }
  }, [ev]);

  return (
    <div className="live-chat" style={height ? { height: `${height}px` } : {}}>
      {(options?.showHeader ?? true) && (
        <div className="header">
          <h2 className="title">Stream Chat</h2>
          <Icon
            name="link"
            size={32}
            onClick={() => window.open(`/chat/${naddr}?chat=true`, "_blank", "popup,width=400,height=800")}
          />
        </div>
      )}
      {zaps.length > 0 && (
        <div className="top-zappers">
          <h3>Top zappers</h3>
          <div className="top-zappers-container">
            <TopZappers zaps={zaps} />
          </div>
          {goal && <Goal ev={goal} zaps={goalZaps} />}
          {login?.pubkey === streamer && <NewGoalDialog link={link} />}
        </div>
      )}
      <div className="messages">
        {events.map((a) => {
          switch (a.kind) {
            case LIVE_STREAM_CHAT: {
              return (
                <ChatMessage
                  emojiPacks={allEmojiPacks}
                  streamer={streamer}
                  ev={a}
                  key={a.id}
                  reactions={feed.reactions}
                />
              );
            }
            case EventKind.ZapReceipt: {
              const zap = zaps.find(
                (b) => b.id === a.id && b.receiver === streamer
              );
              if (zap) {
                return <ChatZap zap={zap} key={a.id} />;
              }
            }
          }
          return null;
        })}
        {feed.messages.length === 0 && <Spinner />}
      </div>
      {(options?.canWrite ?? true) && (
        <div className="write-message">
          {login ? (
            <WriteMessage emojiPacks={allEmojiPacks} link={link} />
          ) : (
            <p>Please login to write messages!</p>
          )}
        </div>
      )}
    </div>
  );
}

const BIG_ZAP_THRESHOLD = 100_000;

function ChatZap({ zap }: { zap: ParsedZap }) {
  if (!zap.valid) {
    return null;
  }
  const isBig = zap.amount >= BIG_ZAP_THRESHOLD;

  return (
    <div className={`zap-container ${isBig ? "big-zap" : ""}`}>
      <div className="zap">
        <Icon name="zap-filled" className="zap-icon" />
        <Profile
          pubkey={zap.anonZap ? "anon" : zap.sender ?? "anon"}
          options={{
            showAvatar: !zap.anonZap,
            overrideName: zap.anonZap ? "Anon" : undefined,
          }}
        />
        zapped
        <span className="zap-amount">{formatSats(zap.amount)}</span>
        sats
      </div>
      {zap.content && <div className="zap-content">{zap.content}</div>}
    </div>
  );
}
