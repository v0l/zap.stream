import { LIVE_STREAM_CHAT, LIVE_STREAM_CLIP, LIVE_STREAM_RAID, StreamState } from "@/const";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { formatSats } from "@/number";
import { extractStreamInfo } from "@/utils";
import { unixNow } from "@snort/shared";
import { NostrLink, NostrEvent, ParsedZap, EventKind, TaggedNostrEvent } from "@snort/system";
import { useEventReactions, useReactions } from "@snort/system-react";
import { useMemo } from "react";
import { FormattedMessage, FormattedNumber, FormattedDate } from "react-intl";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Tooltip } from "recharts";
import { Profile } from "./profile";
import { StatePill } from "./state-pill";
import { Link } from "react-router-dom";
import { Icon } from "./icon";
import EventReactions from "./event-reactions";

interface StatSlot {
  time: number;
  zaps: number;
  messages: number;
  reactions: number;
  clips: number;
  raids: number;
  shares: number;
}

export default function StreamSummary({ link, preload }: { link: NostrLink; preload?: NostrEvent }) {
  const ev = useCurrentStreamFeed(link, true, preload ? ({ ...preload, relays: [] } as TaggedNostrEvent) : undefined);
  const thisLink = ev ? NostrLink.fromEvent(ev) : undefined;
  const data = useReactions(
    `live:${link?.id}:${link?.author}:reactions`,
    thisLink ? [thisLink] : [],
    rb => {
      if (thisLink) {
        rb.withFilter().kinds([LIVE_STREAM_CHAT, LIVE_STREAM_RAID, LIVE_STREAM_CLIP]).replyToLink([thisLink]);
      }
    },
    true,
  );
  const reactions = useEventReactions(thisLink ?? link, data);

  const chatSummary = useMemo(() => {
    return Object.entries(
      data
        .filter(a => a.kind === LIVE_STREAM_CHAT)
        .reduce(
          (acc, v) => {
            acc[v.pubkey] ??= [];
            acc[v.pubkey].push(v);
            return acc;
          },
          {} as Record<string, Array<NostrEvent>>,
        ),
    )
      .map(([k, v]) => ({
        pubkey: k,
        messages: v,
      }))
      .sort((a, b) => (a.messages.length > b.messages.length ? -1 : 1));
  }, [data]);

  const zapsSummary = useMemo(() => {
    return Object.entries(
      reactions.zaps.reduce(
        (acc, v) => {
          if (!v.sender) return acc;
          acc[v.sender] ??= [];
          acc[v.sender].push(v);
          return acc;
        },
        {} as Record<string, Array<ParsedZap>>,
      ),
    )
      .map(([k, v]) => ({
        pubkey: k,
        zaps: v,
        total: v.reduce((acc, vv) => acc + vv.amount, 0),
      }))
      .sort((a, b) => (a.total > b.total ? -1 : 1));
  }, [reactions.zaps]);

  const totalZaps = useMemo(() => {
    return reactions.zaps.reduce((acc, v) => {
      return acc + v.amount;
    }, 0);
  }, [reactions.zaps]);

  const { title, summary, status, starts } = extractStreamInfo(ev);

  const Day = 60 * 60 * 24;
  const startTime = starts ? Number(starts) : ev?.created_at ?? unixNow();
  const endTime = status === StreamState.Live ? unixNow() : ev?.created_at ?? unixNow();

  const streamLength = endTime - startTime;
  const windowSize = streamLength > Day ? Day : 60 * 10;

  const stats = useMemo(() => {
    let min = unixNow();
    let max = 0;
    const ret = data
      .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
      .filter(a => a.created_at >= startTime && a.created_at < endTime)
      .reduce(
        (acc, v) => {
          const time = Math.floor(v.created_at - (v.created_at % windowSize));
          if (time < min) {
            min = time;
          }
          if (time > max) {
            max = time;
          }
          const key = time.toString();
          acc[key] ??= {
            time,
            zaps: 0,
            messages: 0,
            reactions: 0,
            clips: 0,
            raids: 0,
            shares: 0,
          };

          if (v.kind === LIVE_STREAM_CHAT) {
            acc[key].messages++;
          } else if (v.kind === EventKind.ZapReceipt) {
            acc[key].zaps++;
          } else if (v.kind === EventKind.Reaction) {
            acc[key].reactions++;
          } else if (v.kind === EventKind.TextNote) {
            acc[key].shares++;
          } else if (v.kind === LIVE_STREAM_CLIP) {
            acc[key].clips++;
          } else if (v.kind === LIVE_STREAM_RAID) {
            acc[key].raids++;
          } else {
            console.debug("Uncounted stat", v);
          }
          return acc;
        },
        {} as Record<string, StatSlot>,
      );

    // fill empty time slots
    for (let x = min; x < max; x += windowSize) {
      ret[x.toString()] ??= {
        time: x,
        zaps: 0,
        messages: 0,
        reactions: 0,
        clips: 0,
        raids: 0,
        shares: 0,
      };
    }
    return ret;
  }, [data]);

  return (
    <div className="flex flex-col gap-4">
      <h2>{title}</h2>
      {summary && <p>{summary}</p>}
      <div className="flex gap-1">
        <StatePill state={status as StreamState} />
        {streamLength > 0 && (
          <FormattedMessage
            defaultMessage="Stream Duration {duration} mins"
            id="J/+m9y"
            values={{
              duration: <FormattedNumber value={streamLength / 60} maximumFractionDigits={2} />,
            }}
          />
        )}
      </div>
      <h2>
        <FormattedMessage defaultMessage="Summary" id="RrCui3" />
      </h2>
      <ResponsiveContainer height={200}>
        <BarChart data={Object.values(stats)} margin={{ left: 0, right: 0 }} style={{ userSelect: "none" }}>
          <XAxis tick={false} />
          <YAxis />
          <Bar dataKey="messages" fill="green" stackId="" />
          <Bar dataKey="zaps" fill="yellow" stackId="" />
          <Bar dataKey="reactions" fill="red" stackId="" />
          <Bar dataKey="clips" fill="pink" stackId="" />
          <Bar dataKey="raids" fill="blue" stackId="" />
          <Bar dataKey="shares" fill="purple" stackId="" />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.5)" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as StatSlot;
                return (
                  <div className="bg-layer-1 rounded-xl px-4 py-2 flex flex-col gap-2">
                    <div>
                      <FormattedDate value={data.time * 1000} timeStyle="short" dateStyle="short" />
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <FormattedMessage defaultMessage="Messages" id="hMzcSq" />
                      </div>
                      <div>{data.messages}</div>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <FormattedMessage defaultMessage="Reactions" id="XgWvGA" />
                      </div>
                      <div>{data.reactions}</div>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <FormattedMessage defaultMessage="Zaps" id="OEW7yJ" />
                      </div>
                      <div>{data.zaps}</div>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <FormattedMessage defaultMessage="Clips" id="yLxIgl" />
                      </div>
                      <div>{data.clips}</div>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <FormattedMessage defaultMessage="Raids" id="+y6JUK" />
                      </div>
                      <div>{data.raids}</div>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <FormattedMessage defaultMessage="Shares" id="mrwfXX" />
                      </div>
                      <div>{data.shares}</div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="grid gap-2 grid-cols-3">
        <div className="bg-layer-1 rounded-xl px-4 py-3 flex-1 flex flex-col gap-2">
          <h3>
            <FormattedMessage defaultMessage="Top Chatters" id="GGaJMU" />
          </h3>
          <div className="flex flex-col gap-2">
            {chatSummary.slice(0, 5).map(a => (
              <div className="flex justify-between items-center" key={a.pubkey}>
                <Profile pubkey={a.pubkey} avatarSize={30} />
                <div>
                  <FormattedMessage
                    defaultMessage="{n} messages"
                    id="gzsn7k"
                    values={{
                      n: <FormattedNumber value={a.messages.length} />,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-layer-1 rounded-xl px-4 py-3 flex-1 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3>
              <FormattedMessage defaultMessage="Top Zappers" id="dVD/AR" />
            </h3>
            <span>
              <FormattedMessage
                defaultMessage="Total: {amount} sats"
                id="/Jp9pC"
                values={{
                  amount: (
                    <b>
                      <FormattedNumber value={totalZaps} />
                    </b>
                  ),
                }}
              />
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {zapsSummary.slice(0, 5).map(a => (
              <div className="flex justify-between items-center" key={a.pubkey}>
                <Profile pubkey={a.zaps.some(b => b.anonZap) ? "anon" : a.pubkey} avatarSize={30} />
                <div>
                  <FormattedMessage
                    defaultMessage="{n} sats"
                    values={{
                      n: formatSats(a.total),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-layer-1 rounded-xl px-4 py-3 flex-1 flex flex-col gap-2">
          <h3>
            <FormattedMessage defaultMessage="Raids" id="+y6JUK" />
          </h3>
          <div className="flex flex-col gap-2">
            {data
              .filter(a => a.kind === LIVE_STREAM_RAID)
              .map(a => {
                const mins = a.created_at - startTime;
                return (
                  <div className="flex justify-between items-center" key={a.id}>
                    <Profile pubkey={a.pubkey} avatarSize={30} />
                    <FormattedMessage
                      defaultMessage="@ {n,selectordinal, one {#st} two {#nd} few {#rd} other {#th}} min"
                      values={{
                        n: Math.floor(mins / 60),
                      }}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      <div className="grid gap-2 grid-cols-2">
        <div className="bg-layer-1 rounded-xl px-4 py-3 flex-1 flex flex-col gap-2">
          <h3>
            <FormattedMessage defaultMessage="Shares" id="mrwfXX" />
          </h3>
          {data
            .filter(a => a.kind === EventKind.TextNote)
            .map(a => (
              <SharedNote ev={a} key={a.id} />
            ))}
        </div>
        <div className="bg-layer-1 rounded-xl px-4 py-3 flex-1 flex flex-col gap-2">
          <h3>
            <FormattedMessage defaultMessage="Clips" id="yLxIgl" />
          </h3>
          <div className="flex flex-col gap-2">
            {data
              .filter(a => a.kind === LIVE_STREAM_CLIP)
              .map(a => {
                const link = NostrLink.fromEvent(a)!;
                return (
                  <div className="flex justify-between items-center" key={a.id}>
                    <Profile pubkey={a.pubkey} avatarSize={30} />
                    <div className="flex gap-2">
                      <EventReactions ev={a} />
                      <Link to={`/${link.encode()}`}>
                        <Icon name="link" size={26} />
                      </Link>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SharedNote({ ev }: { ev: TaggedNostrEvent }) {
  return (
    <div className="flex gap-2 items-center">
      <Profile pubkey={ev.pubkey} avatarSize={30} />
      <div className="truncate text-layer-4">{ev.content}</div>
      <EventReactions ev={ev} />
    </div>
  );
}
