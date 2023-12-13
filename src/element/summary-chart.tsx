import { LIVE_STREAM_CHAT, StreamState } from "@/const";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { useLiveChatFeed } from "@/hooks/live-chat";
import { formatSats } from "@/number";
import { extractStreamInfo } from "@/utils";
import { unixNow } from "@snort/shared";
import { NostrLink, NostrEvent, ParsedZap, EventKind } from "@snort/system";
import { useEventReactions } from "@snort/system-react";
import { useMemo } from "react";
import { FormattedMessage, FormattedNumber, FormattedDate } from "react-intl";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Tooltip } from "recharts";
import { Profile } from "./profile";
import { StatePill } from "./state-pill";

interface StatSlot {
  time: number;
  zaps: number;
  messages: number;
  reactions: number;
}

export default function StreamSummary({ link, preload }: { link: NostrLink; preload?: NostrEvent }) {
  const ev = useCurrentStreamFeed(link, true, preload);
  const thisLink = ev ? NostrLink.fromEvent(ev) : undefined;
  const data = useLiveChatFeed(thisLink, undefined, 5_000);
  const reactions = useEventReactions(thisLink ?? link, data.reactions);

  const chatSummary = useMemo(() => {
    return Object.entries(
      data.messages.reduce((acc, v) => {
        acc[v.pubkey] ??= [];
        acc[v.pubkey].push(v);
        return acc;
      }, {} as Record<string, Array<NostrEvent>>)
    )
      .map(([k, v]) => ({
        pubkey: k,
        messages: v,
      }))
      .sort((a, b) => (a.messages.length > b.messages.length ? -1 : 1));
  }, [data.messages]);

  const zapsSummary = useMemo(() => {
    return Object.entries(
      reactions.zaps.reduce((acc, v) => {
        if (!v.sender) return acc;
        acc[v.sender] ??= [];
        acc[v.sender].push(v);
        return acc;
      }, {} as Record<string, Array<ParsedZap>>)
    )
      .map(([k, v]) => ({
        pubkey: k,
        zaps: v,
        total: v.reduce((acc, vv) => acc + vv.amount, 0),
      }))
      .sort((a, b) => (a.total > b.total ? -1 : 1));
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
    const ret = [...data.messages, ...data.reactions]
      .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
      .reduce((acc, v) => {
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
        };

        if (v.kind === LIVE_STREAM_CHAT) {
          acc[key].messages++;
        } else if (v.kind === EventKind.ZapReceipt) {
          acc[key].zaps++;
        } else if (v.kind === EventKind.Reaction) {
          acc[key].reactions++;
        } else {
          console.debug("Uncounted stat", v);
        }
        return acc;
      }, {} as Record<string, StatSlot>);

    // fill empty time slots
    for (let x = min; x < max; x += windowSize) {
      ret[x.toString()] ??= {
        time: x,
        zaps: 0,
        messages: 0,
        reactions: 0,
      };
    }
    return ret;
  }, [data]);

  return (
    <div className="stream-summary">
      <h1>{title}</h1>
      <p>{summary}</p>
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
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.2)" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as StatSlot;
                return (
                  <div className="plain-paper flex flex-col gap-2">
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
                  </div>
                );
              }
              return null;
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-1">
        <div className="plain-paper flex-1">
          <h3>
            <FormattedMessage defaultMessage="Top Chatters" id="GGaJMU" />
          </h3>
          <div className="flex flex-col gap-2">
            {chatSummary.slice(0, 5).map(a => (
              <div className="flex justify-between items-center" key={a.pubkey}>
                <Profile pubkey={a.pubkey} />
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
        <div className="plain-paper flex-1">
          <h3>
            <FormattedMessage defaultMessage="Top Zappers" id="dVD/AR" />
          </h3>
          <div className="flex flex-col gap-2">
            {zapsSummary.slice(0, 5).map(a => (
              <div className="flex justify-between items-center" key={a.pubkey}>
                <Profile pubkey={a.pubkey} />
                <div>
                  <FormattedMessage
                    defaultMessage="{n} sats"
                    id="CsCUYo"
                    values={{
                      n: formatSats(a.total),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
