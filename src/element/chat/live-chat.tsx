import "./live-chat.css";
import { FormattedMessage } from "react-intl";
import { EventKind, type NostrEvent, NostrLink, type ParsedZap, type TaggedNostrEvent } from "@snort/system";
import { useEventFeed, useEventReactions, useUserProfile } from "@snort/system-react";
import { removeUndefined, unixNow, unwrap, NostrPrefix } from "@snort/shared";
import { useEffect, useMemo } from "react";

import { Icon } from "../icon";
import Spinner from "../spinner";
import { Text } from "../text";
import { Profile } from "../profile";
import { ChatMessage } from "./chat-message";
import { Goal } from "../goal";
import { BadgeInfo } from "../badge";
import { WriteMessage } from "./write-message";
import useEmoji, { packId } from "@/hooks/emoji";
import { useMutedPubkeys } from "@/hooks/lists";
import { useBadgeAwards } from "@/hooks/badges";
import { useLogin } from "@/hooks/login";
import { formatZapAmount } from "@/number";
import { LIVE_STREAM_CHAT, LIVE_STREAM_CLIP, LIVE_STREAM_RAID, WEEK } from "@/const";
import { findTag, getHost, getTagValues, uniqBy } from "@/utils";
import { TopZappers } from "../top-zappers";
import { Link, useNavigate } from "react-router";
import classNames from "classnames";
import { useStream } from "../stream/stream-state";
import { useLayout } from "@/pages/layout/context";
import { useTwitchChat } from "@/hooks/twitch-chat";
import { TwitchChatMessage } from "./twitch";

function BadgeAward({ ev }: { ev: NostrEvent }) {
  const badge = findTag(ev, "a") ?? "";
  const [k, pubkey, d] = badge.split(":");
  const awardees = getTagValues(ev.tags, "p");
  const event = useEventFeed(new NostrLink(NostrPrefix.Address, d, Number(k), pubkey));
  return (
    <div className="badge-award">
      {event && <BadgeInfo ev={event} />}
      <p>awarded to</p>
      <div className="badge-awardees">
        {awardees.map(pk => (
          <Profile key={pk} pubkey={pk} />
        ))}
      </div>
    </div>
  );
}

export function LiveChat({
  canWrite,
  showTopZappers,
  adjustLayout,
  showGoal,
  showScrollbar,
  height,
  className,
  autoRaid,
  twitchToken,
  showBadges
}: {
  canWrite?: boolean;
  showTopZappers?: boolean;
  adjustLayout?: boolean;
  showGoal?: boolean;
  showScrollbar?: boolean;
  height?: number;
  className?: string;
  autoRaid?: boolean;
  twitchToken?: string;
  showBadges?: boolean;
}) {
  const streamContext = useStream();
  const login = useLogin();
  const layoutContext = useLayout();

  // Use data from context
  const link = streamContext.link!;
  const feed = streamContext.feed;
  const goal = streamContext.goal;
  const event = streamContext.event;
  const relays = streamContext.relays;

  const host = event ? getHost(event) : undefined;
  const started = useMemo(() => {
    const starts = findTag(event, "starts");
    return starts ? Number(starts) : unixNow() - WEEK;
  }, [event]);
  const { awards } = useBadgeAwards(host);

  const { chatLog: twitchChat, badges: twitchBadges, connected_at: twitchConnectedAt, login: twitchLogin } = useTwitchChat(twitchToken);
  const hostMutedPubkeys = useMutedPubkeys(host, true);
  const userEmojiPacks = useEmoji(login?.pubkey);
  const channelEmojiPacks = useEmoji(host);
  const allEmojiPacks = useMemo(() => {
    return uniqBy(userEmojiPacks.concat(channelEmojiPacks), packId);
  }, [userEmojiPacks, channelEmojiPacks]);

  const reactions = useEventReactions(link, feed);
  const events = useMemo(() => {
    const extra = [];
    const starts = findTag(event, "starts");
    if (starts) {
      extra.push({ kind: -1, created_at: Number(starts) } as TaggedNostrEvent);
    }
    const ends = findTag(event, "ends");
    if (ends) {
      extra.push({ kind: -2, created_at: Number(ends) } as TaggedNostrEvent);
    }
    for (const tc of twitchChat) {
      extra.push({
        kind: -3,
        id: tc.meta.message_id,
        created_at: Math.floor(new Date(tc.meta.message_timestamp).getTime() / 1000),
        chat: tc
      } as unknown as TaggedNostrEvent)
    }
    if (twitchConnectedAt) {
      extra.push({ kind: -4, created_at: twitchConnectedAt } as TaggedNostrEvent);
    }
    return removeUndefined([...feed, ...awards.map(a => a.event), ...extra])
      .filter(a => a.created_at >= started && (!ends || a.created_at <= Number(ends)))
      .sort((a, b) => b.created_at - a.created_at);
  }, [feed, awards, twitchChat, twitchConnectedAt]);

  useEffect(() => {
    const resetLayout = () => {
      if (streamContext.showDetails || !adjustLayout) {
        streamContext.update(c => {
          c.showDetails = !adjustLayout;
          return { ...c };
        });
      }
      if (!layoutContext.showHeader) {
        layoutContext.update(c => {
          c.showHeader = true;
          return { ...c };
        });
      }
    };

    if (adjustLayout) {
      layoutContext.update(c => {
        c.showHeader = false;
        return { ...c };
      });
      return () => {
        resetLayout();
      };
    } else {
      resetLayout();
    }
  }, [adjustLayout]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (!e.pubkey) return true; // injected content
      const author = NostrLink.publicKey(e.pubkey);
      return (
        !(login?.state?.muted.some(a => a.equals(author)) ?? false) && !hostMutedPubkeys.some(a => a.equals(author))
      );
    });
  }, [events, login?.state?.version, hostMutedPubkeys]);

  return (
    <div className={classNames("flex flex-col gap-1", className)} style={height ? { height: `${height}px` } : {}}>
      {adjustLayout && (
        <div
          className="min-h-2 my-2"
          onClick={() => {
            streamContext.update(c => {
              c.showDetails = !c.showDetails;
              return { ...c };
            });
            layoutContext.update(c => {
              c.showHeader = !streamContext.showDetails;
              return { ...c };
            });
          }}>
          <div className="h-2 bg-layer-3 rounded-full w-10 mx-auto"></div>
        </div>
      )}
      {(showTopZappers ?? true) && reactions.zaps.length > 0 && (
        <div>
          <div className="flex gap-1 overflow-x-auto scrollbar-hidden">
            <TopZappers zaps={reactions.zaps} className="border border-layer-2 rounded-full py-1 px-2" />
          </div>
        </div>
      )}
      {(showGoal ?? true) && goal && <Goal ev={goal} />}
      <div
        className={classNames("flex flex-col-reverse grow gap-2 overflow-y-auto", {
          "scrollbar-hidden": !(showScrollbar ?? true),
        })}>
        {filteredEvents.map((a, i) => {
          const currentDate = new Date(a.created_at * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          const prevDate = i > 0 ? new Date(filteredEvents[i - 1].created_at * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
          const showDateSeparator = prevDate && currentDate !== prevDate;

          const mapper = () => {
            switch (a.kind) {
              case -1:
              case -2: {
                return (
                  <b
                    className="border px-3 py-2 text-center border-layer-2 rounded-xl bg-primary uppercase"
                    key={`${a.kind}-${a.created_at}`}>
                    {a.kind === -1 ? (
                      <FormattedMessage defaultMessage="Stream Started" />
                    ) : (
                      <FormattedMessage defaultMessage="Stream Ended" />
                    )}
                  </b>
                );
              }
              case -3: {
                return <TwitchChatMessage ev={a} key={a.id} badges={(showBadges ?? true) ? twitchBadges : []} />;
              }
              case -4: {
                if (twitchLogin) {
                  return <div className="text-center text-xs text-gray-500">
                    <FormattedMessage defaultMessage="Twitch chat {channel} connected" values={{
                      channel: `'${twitchLogin}'`
                    }} />
                  </div>
                }
                break;
              }
              case EventKind.BadgeAward: {
                return <BadgeAward ev={a} key={a.id} />;
              }
              case LIVE_STREAM_CHAT: {
                return <ChatMessage badges={(showBadges ?? true) ? awards : []} emojiPacks={allEmojiPacks} streamer={host} ev={a} key={a.id} />;
              }
              case LIVE_STREAM_RAID: {
                return <ChatRaid ev={a} link={link} key={a.id} autoRaid={autoRaid} />;
              }
              case LIVE_STREAM_CLIP: {
                return <ChatClip ev={a} key={a.id} />;
              }
              case EventKind.ZapReceipt: {
                const zap = reactions.zaps.find(b => b.id === a.id && b.receiver === host);
                if (zap) {
                  return <ChatZap zap={zap} key={a.id} />;
                }
              }
            }
          }

          const mapped = mapper();
          if (!mapped) return;
          return <>
            {showDateSeparator && (
              <div className="text-center text-xs text-gray-500">{prevDate}</div>
            )}
            {mapped}
          </>
        })}
        {feed.length === 0 && <Spinner />}
      </div>
      {(canWrite ?? true) && (
        <div className="flex gap-2 border-t py-2 border-layer-1">
          {login ? (
            <WriteMessage emojiPacks={allEmojiPacks} link={link} relays={relays} />
          ) : (
            <p>
              <FormattedMessage defaultMessage="Please login to write messages!" id="RXQdxR" />
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const BIG_ZAP_THRESHOLD = 50_000;

export function ChatZap({ zap }: { zap: ParsedZap }) {
  if (!zap.valid) {
    return null;
  }
  const isBig = zap.amount >= BIG_ZAP_THRESHOLD;

  return (
    <div className={`zap-container overflow-wrap ${isBig ? "big-zap" : ""}`}>
      <div className="flex gap-1 items-center">
        <Icon name="zap-filled" className="text-zap" />
        <FormattedMessage
          defaultMessage="<s>{person}</s> zapped <a>{amount}</a>"
          values={{
            s: c => <span className="text-zap">{c}</span>,
            a: c => <span className="text-zap">
              <span className="text-sm">₿</span>
              {" "}
              {c}
            </span>,
            person: (
              <Profile
                pubkey={zap.anonZap ? "anon" : zap.sender ?? ""}
                options={{
                  showAvatar: !zap.anonZap,
                }}
              />
            ),
            amount: <span className="zap-amount">{formatZapAmount(zap.amount)}</span>,
          }}
        />
      </div>
      {zap.content && <Text content={zap.content} tags={[]} />}
    </div>
  );
}

export function ChatRaid({ link, ev, autoRaid }: { link: NostrLink; ev: TaggedNostrEvent; autoRaid?: boolean }) {
  const navigate = useNavigate();
  const from = ev.tags.find(a => a[0] === "a" && a[3] === "root");
  const to = ev.tags.find(a => a[0] === "a" && a[3] === "mention");
  const isRaiding = link.toEventTag()?.at(1) === from?.at(1);
  const otherLink = NostrLink.fromTag(unwrap(isRaiding ? to : from));
  const otherEvent = useEventFeed(otherLink);
  const otherProfile = useUserProfile(otherEvent ? getHost(otherEvent) : undefined);

  useEffect(() => {
    const raidDiff = Math.abs(unixNow() - ev.created_at);
    if (isRaiding === true && raidDiff < 60 && otherLink.id !== link.id && (autoRaid ?? true)) {
      navigate(`/${otherLink.encode()}`);
    }
  }, [isRaiding, autoRaid]);

  if (isRaiding) {
    return (
      <Link
        to={`/${otherLink.encode()}`}
        className="px-3 py-2 text-center rounded-xl bg-primary uppercase pointer font-bold">
        <FormattedMessage
          defaultMessage="Raiding {name}"
          id="j/jueq"
          values={{
            name: otherProfile?.name,
          }}
        />
      </Link>
    );
  }
  return (
    <div className="px-3 py-2 text-center rounded-xl bg-primary uppercase pointer font-bold">
      <FormattedMessage
        defaultMessage="Raid from {name}"
        id="69hmpj"
        values={{
          name: otherProfile?.name,
        }}
      />
    </div>
  );
}

function ChatClip({ ev }: { ev: TaggedNostrEvent }) {
  const profile = useUserProfile(ev.pubkey);
  const rTag = findTag(ev, "r");
  const title = findTag(ev, "title");
  return (
    <div className="px-3 py-2 text-center rounded-xl bg-primary pointer flex flex-col gap-2">
      <div className="font-bold uppercase">
        <FormattedMessage
          defaultMessage="{name} created a clip"
          id="BD0vyn"
          values={{
            name: profile?.name,
          }}
        />
      </div>
      <div>{title}</div>
      {rTag && <video src={rTag} controls playsInline={true} muted={true} />}
    </div>
  );
}
