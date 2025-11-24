import { NostrPrefix, dedupe, removeUndefined, sanitizeRelayUrl } from "@snort/shared";
import { EventKind, NostrEvent, NostrLink, RequestBuilder, TaggedNostrEvent } from "@snort/system";
import { useEventReactions, useRequestBuilder } from "@snort/system-react";
import { ReactNode, createContext, useContext, useMemo, useState } from "react";
import { LIVE_STREAM_CHAT, LIVE_STREAM_CLIP, LIVE_STREAM_RAID } from "@/const";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { useZapGoal } from "@/hooks/goals";
import { StreamInfo, extractStreamInfo } from "@/utils";

interface StreamState {
  link?: NostrLink;
  event?: NostrEvent;
  goal?: NostrEvent;
  relays: string[];
  showDetails: boolean;
  info?: StreamInfo;
  feed: Array<TaggedNostrEvent>;
  reactions: ReturnType<typeof useEventReactions>;
  update: (fn: (c: StreamState) => StreamState) => void;
}

const StreamContext = createContext<StreamState | undefined>(undefined);

export function StreamContextProvider({
  children,
  link,
  evPreload,
}: {
  children?: ReactNode;
  link: NostrLink;
  evPreload?: TaggedNostrEvent;
}) {
  const event = useCurrentStreamFeed(link, true, evPreload);
  const [state, setState] = useState<StreamState>({
    link,
    showDetails: false,
    relays: link.relays ?? [],
    feed: [],
    reactions: {
      deletions: [],
      reactions: {
        all: [],
        positive: [],
        negative: [],
      },
      replies: [],
      reposts: [],
      zaps: [],
      others: {},
    },
    update: () => {},
  });

  // Extract goal tag from stream event and load the goal
  const info = extractStreamInfo(event);
  const goal = useZapGoal(info.goal);

  // Extract relays from stream event
  const relays = useMemo(() => {
    return dedupe(removeUndefined(event?.tags.filter(a => a[0] === "relays").map(a => sanitizeRelayUrl(a[1])) ?? []));
  }, [event?.id]);

  const eventLink = useMemo(
    () =>
      event
        ? NostrLink.fromEvent(event)
        : link.type === NostrPrefix.Address || link.type === NostrPrefix.Event
          ? link
          : undefined,
    [event?.id, link],
  );
  const goalLink = useMemo(() => (goal ? NostrLink.fromEvent(goal) : null), [goal?.id]);

  const rb = useMemo(() => {
    const rb = new RequestBuilder(`"stream:${link.tagKey}`);
    rb.withOptions({
      leaveOpen: true,
    });
    if (eventLink) {
      rb.withFilter()
        .kinds([LIVE_STREAM_CHAT, LIVE_STREAM_RAID, LIVE_STREAM_CLIP])
        .limit(200)
        .replyToLink([eventLink])
        .relay(relays);
      rb.withFilter().kinds([EventKind.ZapReceipt]).replyToLink([eventLink]).relay(relays);
    }
    if (goalLink) {
      rb.withFilter().kinds([EventKind.ZapReceipt]).replyToLink([goalLink]).relay(relays);
    }

    return rb;
  }, [link, eventLink, goalLink, relays]);

  const feed = useRequestBuilder(rb);
  const reactions = useEventReactions(eventLink ?? link, feed);

  const streamState = {
    ...state,
    link: eventLink,
    event,
    goal,
    relays,
    feed,
    info,
    reactions,
    update: (fn: (c: StreamState) => StreamState) => {
      setState(x => {
        return {
          ...x,
          ...fn(x),
        };
      });
    },
  };

  return <StreamContext.Provider value={streamState}>{children}</StreamContext.Provider>;
}

export function useStream() {
  const ctx = useContext(StreamContext);
  if (!ctx) {
    throw new Error("Context doesnt exist!");
  }
  return ctx;
}
