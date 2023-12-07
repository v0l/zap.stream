import AsyncButton from "@/element/async-button";
import { ChatZap, LiveChat } from "@/element/live-chat";
import LiveVideoPlayer from "@/element/live-video-player";
import { MuteButton } from "@/element/mute-button";
import { Profile } from "@/element/profile";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { useLiveChatFeed } from "@/hooks/live-chat";
import { useLogin } from "@/hooks/login";
import { extractStreamInfo } from "@/utils";
import { dedupe } from "@snort/shared";
import { NostrLink, NostrPrefix, ParsedZap } from "@snort/system";
import { useEventReactions } from "@snort/system-react";
import classNames from "classnames";
import { HTMLProps, ReactNode, useEffect, useMemo, useState } from "react";
import { FormattedMessage, FormattedNumber } from "react-intl";
import { Text } from "@/element/text";
import { StreamTimer } from "@/element/stream-time";
import * as Dialog from "@radix-ui/react-dialog";
import { DashboardRaidMenu } from "@/element/raid-menu";

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
  if (!streamLink) return;

  return (
    <div className="grid grid-cols-3 gap-2 full-page-height">
      <div className="h-inhreit flex gap-4 flex-col">
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
            <DashboardChatList link={streamLink} />
          </div>
        </DashboardCard>
      </div>
      <div className="h-inhreit flex gap-4 flex-col">
        <DashboardZapColumn link={streamLink} />
      </div>
      <LiveChat link={streamLink} ev={streamEvent} />
    </div>
  );
}

function DashboardCard(props: HTMLProps<HTMLDivElement>) {
  return (
    <div {...props} className={classNames("px-4 py-6 rounded-3xl border border-gray-1", props.className)}>
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
      className={classNames("flex-1 bg-gray-1 flex flex-col gap-1 px-4 py-2 rounded-xl", props.className)}>
      <div className="text-gray-3 font-medium">{name}</div>
      <div>{value}</div>
    </div>
  );
}

function DashboardChatList({ link }: { link: NostrLink }) {
  const feed = useLiveChatFeed(link);

  const pubkeys = useMemo(() => {
    return dedupe(feed.messages.map(a => a.pubkey));
  }, [feed]);

  return pubkeys.map(a => (
    <div className="flex justify-between items-center px-4 py-2 border-b border-gray-1">
      <Profile pubkey={a} avatarSize={32} gap={4} />
      <div className="flex gap-2">
        <MuteButton pubkey={a} />
        <AsyncButton onClick={() => {}} className="font-bold">
          <FormattedMessage defaultMessage="Zap" id="fBI91o" />
        </AsyncButton>
      </div>
    </div>
  ));
}

function DashboardZapColumn({ link }: { link: NostrLink }) {
  const feed = useLiveChatFeed(link);
  const reactions = useEventReactions(link, feed.reactions);

  const sortedZaps = useMemo(
    () => reactions.zaps.sort((a, b) => (b.created_at > a.created_at ? 1 : -1)),
    [reactions.zaps]
  );
  const latestZap = sortedZaps.at(0);
  return (
    <DashboardCard className="h-inhreit flex flex-col gap-4">
      <h3>
        <FormattedMessage defaultMessage="Zaps" id="OEW7yJ" />
      </h3>
      <div className="h-inhreit flex flex-col gap-2 overflow-y-scroll">
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
    <div className="px-4 py-6 bg-gray-1 flex flex-col gap-4 rounded-xl animate-flash">
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
    <Dialog.Root open={show} onOpenChange={setShow}>
      <AsyncButton className="btn btn-primary" onClick={() => setShow(true)}>
        <FormattedMessage defaultMessage="Raid" id="4iBdw1" />
      </AsyncButton>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <DashboardRaidMenu link={link} onClose={() => setShow(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
