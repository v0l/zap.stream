import { useMemo } from "react";
import { unixNow } from "@snort/shared";
import { useLocation } from "react-router-dom";
import { EventKind, NostrEvent, NostrLink, ParsedZap } from "@snort/system";
import { useEventReactions } from "@snort/system-react";
import { FormattedDate, FormattedMessage, FormattedNumber } from "react-intl";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { LIVE_STREAM_CHAT } from "const";
import { Profile } from "element/profile";
import { StatePill } from "element/state-pill";
import { useCurrentStreamFeed } from "hooks/current-stream-feed";
import { useLiveChatFeed } from "hooks/live-chat";
import { useStreamLink } from "hooks/stream-link";
import { StreamState } from "index";
import { formatSats } from "number";
import { findTag, getEventFromLocationState } from "utils";

export function StreamSummaryPage() {
    const location = useLocation();
    const evPreload = getEventFromLocationState(location.state);
    const link = useStreamLink();
    if (link) {
        return <StreamSummary link={link} preload={evPreload} />;
    }
}

interface StatSlot {
    time: number;
    zaps: number;
    messages: number;
    reactions: number;
}

export function StreamSummary({ link, preload }: { link: NostrLink; preload?: NostrEvent }) {
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

    const title = findTag(ev, "title");
    const summary = findTag(ev, "summary");
    const status = findTag(ev, "status");
    const starts = findTag(ev, "starts");

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
            <div className="flex g8">
                <StatePill state={status as StreamState} />
                {streamLength > 0 && (
                    <FormattedMessage
                        defaultMessage="Stream Duration {duration} mins"
                        values={{
                            duration: <FormattedNumber value={streamLength / 60} maximumFractionDigits={2} />,
                        }}
                    />
                )}
            </div>
            <h2>
                <FormattedMessage defaultMessage="Summary" />
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
                                    <div className="plain-paper flex f-col g8">
                                        <div>
                                            <FormattedDate value={data.time * 1000} timeStyle="short" dateStyle="short" />
                                        </div>
                                        <div className="flex f-space">
                                            <div>
                                                <FormattedMessage defaultMessage="Messages" />
                                            </div>
                                            <div>{data.messages}</div>
                                        </div>
                                        <div className="flex f-space">
                                            <div>
                                                <FormattedMessage defaultMessage="Reactions" />
                                            </div>
                                            <div>{data.reactions}</div>
                                        </div>
                                        <div className="flex f-space">
                                            <div>
                                                <FormattedMessage defaultMessage="Zaps" />
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

            <div className="flex g8">
                <div className="plain-paper f-1">
                    <h3>
                        <FormattedMessage defaultMessage="Top Chatters" />
                    </h3>
                    <div className="flex f-col g8">
                        {chatSummary.slice(0, 5).map(a => (
                            <div className="flex f-space f-center" key={a.pubkey}>
                                <Profile pubkey={a.pubkey} />
                                <div>
                                    <FormattedMessage
                                        defaultMessage="{n} messages"
                                        values={{
                                            n: <FormattedNumber value={a.messages.length} />,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="plain-paper f-1">
                    <h3>
                        <FormattedMessage defaultMessage="Top Zappers" />
                    </h3>
                    <div className="flex f-col g8">
                        {zapsSummary.slice(0, 5).map(a => (
                            <div className="flex f-space f-center" key={a.pubkey}>
                                <Profile pubkey={a.pubkey} />
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
            </div>
        </div>
    );
}
