import { LIVE_STREAM_CHAT, LIVE_STREAM_CLIP, LIVE_STREAM_RAID, StreamState } from "@/const"
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed"
import { formatSats } from "@/number"
import { extractStreamInfo } from "@/utils"
import { unixNow } from "@snort/shared"
import { NostrLink, type NostrEvent, type ParsedZap, EventKind, type TaggedNostrEvent } from "@snort/system"
import { useEventReactions, useReactions } from "@snort/system-react"
import { type ReactNode, useMemo } from "react"
import { FormattedMessage, FormattedNumber, FormattedDate } from "react-intl"
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Tooltip } from "recharts"
import { Profile } from "./profile"
import { Duration } from "./duration"
import { Link } from "react-router"
import { Icon } from "./icon"
import EventReactions from "./event-reactions"

interface StatSlot {
  time: number
  zaps: number
  messages: number
  reactions: number
  clips: number
  raids: number
  shares: number
}

export default function StreamSummary({ link, preload }: { link: NostrLink; preload?: NostrEvent }) {
  const ev = useCurrentStreamFeed(link, true, preload ? ({ ...preload, relays: [] } as TaggedNostrEvent) : undefined)
  const thisLink = ev ? NostrLink.fromEvent(ev) : undefined
  const data = useReactions(
    `live:${link?.id}:${link?.author}:reactions`,
    thisLink ? [thisLink] : [],
    rb => {
      if (thisLink) {
        rb.withFilter().kinds([LIVE_STREAM_CHAT, LIVE_STREAM_RAID, LIVE_STREAM_CLIP]).replyToLink([thisLink])
      }
    },
    true,
  )
  const reactions = useEventReactions(thisLink ?? link, data)

  const chatSummary = useMemo(() => {
    return Object.entries(
      data
        .filter(a => a.kind === LIVE_STREAM_CHAT)
        .reduce(
          (acc, v) => {
            acc[v.pubkey] ??= []
            acc[v.pubkey].push(v)
            return acc
          },
          {} as Record<string, Array<NostrEvent>>,
        ),
    )
      .map(([k, v]) => ({
        pubkey: k,
        messages: v,
      }))
      .sort((a, b) => (a.messages.length > b.messages.length ? -1 : 1))
  }, [data])

  const zapsSummary = useMemo(() => {
    return Object.entries(
      reactions.zaps.reduce(
        (acc, v) => {
          if (!v.sender) return acc
          acc[v.sender] ??= []
          acc[v.sender].push(v)
          return acc
        },
        {} as Record<string, Array<ParsedZap>>,
      ),
    )
      .map(([k, v]) => ({
        pubkey: k,
        zaps: v,
        total: v.reduce((acc, vv) => acc + vv.amount, 0),
      }))
      .sort((a, b) => (a.total > b.total ? -1 : 1))
  }, [reactions.zaps])

  const totalZaps = useMemo(() => {
    return reactions.zaps.reduce((acc, v) => {
      return acc + v.amount
    }, 0)
  }, [reactions.zaps])

  const { title, summary, status, starts } = extractStreamInfo(ev)

  const Day = 60 * 60 * 24
  const startTime = starts ? Number(starts) : (ev?.created_at ?? unixNow())
  const endTime = status === StreamState.Live ? unixNow() : (ev?.created_at ?? unixNow())

  const streamLength = endTime - startTime
  const windowSize = streamLength > Day ? Day : 60 * 10

  const stats = useMemo(() => {
    let min = unixNow()
    let max = 0
    const ret = data
      .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
      .filter(a => a.created_at >= startTime && a.created_at < endTime)
      .reduce(
        (acc, v) => {
          const time = Math.floor(v.created_at - (v.created_at % windowSize))
          if (time < min) {
            min = time
          }
          if (time > max) {
            max = time
          }
          const key = time.toString()
          acc[key] ??= {
            time,
            zaps: 0,
            messages: 0,
            reactions: 0,
            clips: 0,
            raids: 0,
            shares: 0,
          }

          if (v.kind === LIVE_STREAM_CHAT) {
            acc[key].messages++
          } else if (v.kind === EventKind.ZapReceipt) {
            acc[key].zaps++
          } else if (v.kind === EventKind.Reaction) {
            acc[key].reactions++
          } else if (v.kind === EventKind.TextNote) {
            acc[key].shares++
          } else if (v.kind === LIVE_STREAM_CLIP) {
            acc[key].clips++
          } else if (v.kind === LIVE_STREAM_RAID) {
            acc[key].raids++
          } else {
            console.debug("Uncounted stat", v)
          }
          return acc
        },
        {} as Record<string, StatSlot>,
      )

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
      }
    }
    return ret
  }, [data])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-2xl">{title}</h3>
        {summary && <p className="text-layer-5">{summary}</p>}
      </div>
      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        {streamLength > 0 && (
          <div>
            <dt className="text-sm text-layer-4">
              <FormattedMessage defaultMessage="Duration" />
            </dt>
            <dd className="font-display text-2xl font-extrabold tabular-nums">
              <Duration seconds={streamLength} />
            </dd>
          </div>
        )}
        <div>
          <dt className="text-sm text-layer-4">
            <FormattedMessage defaultMessage="Zapped" />
          </dt>
          <dd className="font-display text-2xl font-extrabold tabular-nums text-primary">
            <FormattedNumber value={totalZaps} />
          </dd>
        </div>
        <div>
          <dt className="text-sm text-layer-4">
            <FormattedMessage defaultMessage="Chat messages" />
          </dt>
          <dd className="font-display text-2xl font-extrabold tabular-nums">
            <FormattedNumber value={data.filter(a => a.kind === LIVE_STREAM_CHAT).length} />
          </dd>
        </div>
      </dl>
      {data.length > 0 && (
        <ResponsiveContainer height={200}>
          <BarChart data={Object.values(stats)} margin={{ left: 0, right: 0 }} style={{ userSelect: "none" }}>
            <XAxis tick={false} stroke="#2c2933" />
            <YAxis stroke="#9a95a3" width={32} allowDecimals={false} />
            <Bar dataKey="messages" fill="#4d7cff" stackId="" />
            <Bar dataKey="zaps" fill="#ffb000" stackId="" />
            <Bar dataKey="reactions" fill="#c13fa8" stackId="" />
            <Bar dataKey="clips" fill="#2f9a5b" stackId="" />
            <Bar dataKey="raids" fill="#8fa8ff" stackId="" />
            <Bar dataKey="shares" fill="#9a95a3" stackId="" />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.06)" }}
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const data = payload[0].payload as StatSlot
                  return (
                    <div className="bg-layer-2 border border-layer-3 rounded-xl px-4 py-2 flex flex-col gap-1 text-sm">
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
                  )
                }
                return null
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {chatSummary.length > 0 && (
          <SummaryList title={<FormattedMessage defaultMessage="Top chatters" />}>
            {chatSummary.slice(0, 5).map(a => (
              <SummaryRow key={a.pubkey} pubkey={a.pubkey}>
                <FormattedMessage
                  defaultMessage="{n} messages"
                  id="gzsn7k"
                  values={{
                    n: <FormattedNumber value={a.messages.length} />,
                  }}
                />
              </SummaryRow>
            ))}
          </SummaryList>
        )}
        {zapsSummary.length > 0 && (
          <SummaryList title={<FormattedMessage defaultMessage="Top zappers" />}>
            {zapsSummary.slice(0, 5).map(a => (
              <SummaryRow key={a.pubkey} pubkey={a.zaps.some(b => b.anonZap) ? "anon" : a.pubkey}>
                <span className="text-primary font-semibold">
                  <FormattedMessage defaultMessage="{n} sats" values={{ n: formatSats(a.total) }} />
                </span>
              </SummaryRow>
            ))}
          </SummaryList>
        )}
        {data.some(a => a.kind === LIVE_STREAM_RAID) && (
          <SummaryList title={<FormattedMessage defaultMessage="Raids" id="+y6JUK" />}>
            {data
              .filter(a => a.kind === LIVE_STREAM_RAID)
              .map(a => (
                <SummaryRow key={a.id} pubkey={a.pubkey}>
                  <FormattedMessage
                    defaultMessage="{n} min in"
                    values={{
                      n: Math.floor((a.created_at - startTime) / 60),
                    }}
                  />
                </SummaryRow>
              ))}
          </SummaryList>
        )}
        {data.some(a => a.kind === EventKind.TextNote) && (
          <SummaryList title={<FormattedMessage defaultMessage="Shares" id="mrwfXX" />}>
            {data
              .filter(a => a.kind === EventKind.TextNote)
              .map(a => (
                <SharedNote ev={a} key={a.id} />
              ))}
          </SummaryList>
        )}
        {data.some(a => a.kind === LIVE_STREAM_CLIP) && (
          <SummaryList title={<FormattedMessage defaultMessage="Clips" id="yLxIgl" />}>
            {data
              .filter(a => a.kind === LIVE_STREAM_CLIP)
              .map(a => (
                <SummaryRow key={a.id} pubkey={a.pubkey}>
                  <div className="flex gap-2 items-center">
                    <EventReactions ev={a} />
                    <Link to={`/${NostrLink.fromEvent(a).encode()}`} aria-label="Open clip">
                      <Icon name="link" size={20} />
                    </Link>
                  </div>
                </SummaryRow>
              ))}
          </SummaryList>
        )}
      </div>
    </div>
  )
}

function SummaryList({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-layer-3 bg-layer-0">
      <h4 className="px-4 py-2.5 border-b border-layer-3 font-sans text-sm font-semibold tracking-normal">{title}</h4>
      <div className="flex flex-col">{children}</div>
    </section>
  )
}

function SummaryRow({ pubkey, children }: { pubkey: string; children: ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-3 px-4 py-2 border-b border-layer-3 last:border-0 text-sm">
      <Profile pubkey={pubkey} avatarSize={24} className="min-w-0 truncate" />
      <span className="shrink-0 text-layer-5">{children}</span>
    </div>
  )
}

function SharedNote({ ev }: { ev: TaggedNostrEvent }) {
  return (
    <div className="flex gap-2 items-center px-4 py-2 border-b border-layer-3 last:border-0 text-sm">
      <Profile pubkey={ev.pubkey} avatarSize={30} />
      <div className="truncate text-layer-4">{ev.content}</div>
      <EventReactions ev={ev} />
    </div>
  )
}
