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
import { unixNow, unwrap } from "@snort/shared";
import { useEffect, useMemo } from "react";
import uniqBy from "lodash.uniqby";

import { Icon } from "element/icon";
import Spinner from "element/spinner";
import { Text } from "element/text";
import { Profile } from "element/profile";
import { ChatMessage } from "element/chat-message";
import { Goal } from "element/goal";
import { Badge } from "element/badge";
import { NewGoalDialog } from "element/new-goal";
import { WriteMessage } from "element/write-message";
import useEmoji, { packId } from "hooks/emoji";
import { useLiveChatFeed } from "hooks/live-chat";
import { useMutedPubkeys } from "hooks/lists";
import { useBadges } from "hooks/badges";
import { useLogin } from "hooks/login";
import useTopZappers from "hooks/top-zappers";
import { useAddress } from "hooks/event";
import { formatSats } from "number";
import { WEEK, LIVE_STREAM_CHAT } from "const";
import { findTag, getTagValues, getHost } from "utils";
import { System } from "index";

export interface LiveChatOptions {
  canWrite?: boolean;
  showHeader?: boolean;
}

function BadgeAward({ ev }: { ev: NostrEvent }) {
  const badge = findTag(ev, "a") ?? "";
  const [k, pubkey, d] = badge.split(":");
  const awardees = getTagValues(ev.tags, "p");
  const event = useAddress(Number(k), pubkey, d);
  return (
    <div className="badge-award">
      {event && <Badge ev={event} />}
      <p>awarded to</p>
      <div className="badge-awardees">
        {awardees.map((pk) => (
          <Profile key={pk} pubkey={pk} />
        ))}
      </div>
    </div>
  );
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
      ...new Set(feed.zaps.flatMap((a) => [a.pubkey, unwrap(findTag(a, "p"))])),
    ];
    System.ProfileLoader.TrackMetadata(pubkeys);
    return () => System.ProfileLoader.UntrackMetadata(pubkeys);
  }, [feed.zaps]);
  const started = useMemo(() => {
    const starts = findTag(ev, "starts");
    return starts ? Number(starts) : unixNow() - WEEK;
  }, [ev]);
  const { badges, awards } = useBadges(host, started);
  const mutedPubkeys = useMemo(() => {
    return new Set(getTagValues(login?.muted.tags ?? [], "p"));
  }, [login]);
  const hostMutedPubkeys = useMutedPubkeys(host, true);
  const userEmojiPacks = login?.emojis ?? [];
  const channelEmojiPacks = useEmoji(host);
  const allEmojiPacks = useMemo(() => {
    return uniqBy(userEmojiPacks.concat(channelEmojiPacks), packId);
  }, [userEmojiPacks, channelEmojiPacks]);

  const zaps = feed.zaps
    .map((ev) => parseZap(ev, System.ProfileLoader.Cache))
    .filter((z) => z && z.valid);
  const events = useMemo(() => {
    return [...feed.messages, ...feed.zaps, ...awards].sort(
      (a, b) => b.created_at - a.created_at
    );
  }, [feed.messages, feed.zaps, awards]);
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
  const filteredEvents = useMemo(() => {
    return events.filter(
      (e) => !mutedPubkeys.has(e.pubkey) && !hostMutedPubkeys.has(e.pubkey)
    );
  }, [events, mutedPubkeys, hostMutedPubkeys]);

  return (
    <div className="live-chat" style={height ? { height: `${height}px` } : {}}>
      {(options?.showHeader ?? true) && (
        <div className="header">
          <h2 className="title">Stream Chat</h2>
          <Icon
            name="link"
            className="secondary"
            size={32}
            onClick={() =>
              window.open(
                `/chat/${naddr}?chat=true`,
                "_blank",
                "popup,width=400,height=800"
              )
            }
          />
        </div>
      )}
      {zaps.length > 0 && (
        <div className="top-zappers">
          <h3>Top zappers</h3>
          <div className="top-zappers-container">
            <TopZappers zaps={zaps} />
          </div>
          {goal && <Goal ev={goal} />}
          {login?.pubkey === streamer && <NewGoalDialog link={link} />}
        </div>
      )}
      <div className="messages">
        {filteredEvents.map((a) => {
          switch (a.kind) {
            case EventKind.BadgeAward: {
              return <BadgeAward ev={a} />;
            }
            case LIVE_STREAM_CHAT: {
              return (
                <ChatMessage
                  badges={badges}
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

const BIG_ZAP_THRESHOLD = 50_000;

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
      {zap.content && (
        <div className="zap-content">
          <Text content={zap.content} tags={[]} />
        </div>
      )}
    </div>
  );
}
