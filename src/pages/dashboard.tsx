import { ChatZap, LiveChat } from "@/element/live-chat";
import LiveVideoPlayer from "@/element/live-video-player";
import { MuteButton } from "@/element/mute-button";
import { Profile } from "@/element/profile";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { useLogin } from "@/hooks/login";
import { extractStreamInfo } from "@/utils";
import { dedupe } from "@snort/shared";
import { NostrLink, NostrPrefix, ParsedZap, TaggedNostrEvent } from "@snort/system";
import { useEventReactions, useReactions } from "@snort/system-react";
import classNames from "classnames";
import { HTMLProps, ReactNode, useEffect, useMemo, useState } from "react";
import { FormattedMessage, FormattedNumber } from "react-intl";
import { Text } from "@/element/text";
import { StreamTimer } from "@/element/stream-time";
import { DashboardRaidMenu } from "@/element/raid-menu";
import { DefaultButton } from "@/element/buttons";
import Modal from "@/element/modal";
import { LIVE_STREAM_CHAT, LIVE_STREAM_RAID, LIVE_STREAM_CLIP } from "@/const";

export default function DashboardPage() {
  const login = useLogin();
  if (!login) return;

  return <DashboardForLink link={new NostrLink(NostrPrefix.PublicKey, login.pubkey)} />;
}

function DashboardForLink({ link }: { link: NostrLink }) {
  const streamEvent = useCurrentStreamFeed(link, true);
  const streamLink = streamEvent ? NostrLink.fromEvent(streamEvent) : undefined;
  const { stream, status, image, participants } = extractStreamInfo(streamEvent);
  const [maxParticipants, setMaxParticipants] = useState(0);
  useEffect(() => {
    if (participants) {
      setMaxParticipants(v => (v < Number(participants) ? Number(participants) : v));
    }
  }, [participants]);

  const feed = useReactions(
    `live:${link?.id}:${streamLink?.author}:reactions`,
    streamLink ? [streamLink] : [],
    rb => {
      if (streamLink) {
        rb.withFilter().kinds([LIVE_STREAM_CHAT, LIVE_STREAM_RAID, LIVE_STREAM_CLIP]).replyToLink([streamLink]);
      }
    },
    true
  );
  if (!streamLink) return;

  return (
    <div className="grid grid-cols-3 gap-2 h-[calc(100%-48px-1rem)]">
      <div className="min-h-0 h-full grid grid-rows-[min-content_auto] gap-2">
        <DashboardCard className="flex flex-col gap-4">
          <h3>
            <FormattedMessage defaultMessage="Stream" id="uYw2LD" />
          </h3>
          <LiveVideoPlayer stream={stream} status={status} poster={image} muted={true} className="w-full" />
          <div className="flex gap-4">
            <DashboardStatsCard
              name={<FormattedMessage defaultMessage="Stream Time" id="miQKuZ" />}
              value={<StreamTimer ev={streamEvent} />}
            />
            <DashboardStatsCard name={<FormattedMessage defaultMessage="Viewers" id="37mth/" />} value={participants} />
            <DashboardStatsCard
              name={<FormattedMessage defaultMessage="Highest Viewers" id="jctiUc" />}
              value={maxParticipants}
            />
          </div>
          <DashboardRaidButton link={streamLink} />
        </DashboardCard>
        <DashboardCard className="flex flex-col gap-4">
          <h3>
            <FormattedMessage defaultMessage="Chat Users" id="RtYNX5" />
          </h3>
          <div className="h-[calc(100%-4rem)] overflow-y-scroll">
            <DashboardChatList feed={feed} />
          </div>
        </DashboardCard>
      </div>
      <DashboardZapColumn link={streamLink} feed={feed} />
      <LiveChat link={streamLink} ev={streamEvent} className="min-h-0" />
    </div>
  );
}

function DashboardCard(props: HTMLProps<HTMLDivElement>) {
  return (
    <div {...props} className={classNames("px-4 py-6 rounded-3xl border border-layer-1", props.className)}>
      {props.children}
    </div>
  );
}

function DashboardStatsCard({
  name,
  value,
  ...props
}: { name: ReactNode; value: ReactNode } & Omit<HTMLProps<HTMLDivElement>, "children" | "name" | "value">) {
  return (
    <div
      {...props}
      className={classNames("flex-1 bg-layer-1 flex flex-col gap-1 px-4 py-2 rounded-xl", props.className)}>
      <div className="text-layer-4 font-medium">{name}</div>
      <div>{value}</div>
    </div>
  );
}

function DashboardChatList({ feed }: { feed: Array<TaggedNostrEvent> }) {
  const pubkeys = useMemo(() => {
    return dedupe(feed.map(a => a.pubkey));
  }, [feed]);

  return pubkeys.map(a => (
    <div className="flex justify-between items-center px-4 py-2 border-b border-layer-1">
      <Profile pubkey={a} avatarSize={32} gap={4} />
      <div className="flex gap-2">
        <MuteButton pubkey={a} />
        <DefaultButton onClick={() => {}} className="font-bold">
          <FormattedMessage defaultMessage="Zap" id="fBI91o" />
        </DefaultButton>
      </div>
    </div>
  ));
}

function DashboardZapColumn({ link, feed }: { link: NostrLink; feed: Array<TaggedNostrEvent> }) {
  const reactions = useEventReactions(link, feed);

  const sortedZaps = useMemo(
    () => reactions.zaps.sort((a, b) => (b.created_at > a.created_at ? 1 : -1)),
    [reactions.zaps]
  );
  const latestZap = sortedZaps.at(0);
  return (
    <DashboardCard className="min-h-0 h-full flex flex-col gap-4">
      <h3>
        <FormattedMessage defaultMessage="Zaps" id="OEW7yJ" />
      </h3>
      <div className="flex flex-col gap-2 overflow-y-scroll">
        {latestZap && <DashboardHighlightZap zap={latestZap} />}
        {sortedZaps.slice(1).map(a => (
          <ChatZap zap={a} />
        ))}
      </div>
    </DashboardCard>
  );
}

function DashboardHighlightZap({ zap }: { zap: ParsedZap }) {
  return (
    <div className="px-4 py-6 bg-layer-1 flex flex-col gap-4 rounded-xl animate-flash">
      <div className="flex justify-between items-center text-zap text-2xl font-semibold">
        <Profile
          pubkey={zap.sender ?? "anon"}
          options={{
            showAvatar: false,
          }}
        />
        <span>
          <FormattedMessage
            defaultMessage="{n} sats"
            id="CsCUYo"
            values={{
              n: <FormattedNumber value={zap.amount} />,
            }}
          />
        </span>
      </div>
      {zap.content && (
        <div className="text-2xl">
          <Text content={zap.content} tags={[]} />
        </div>
      )}
    </div>
  );
}

function DashboardRaidButton({ link }: { link: NostrLink }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <DefaultButton onClick={() => setShow(true)}>
        <FormattedMessage defaultMessage="Raid" id="4iBdw1" />
      </DefaultButton>
      {show && (
        <Modal id="raid-menu" onClose={() => setShow(false)}>
          <DashboardRaidMenu link={link} onClose={() => setShow(false)} />
        </Modal>
      )}
    </>
  );
}
