import { LiveChat } from "@/element/live-chat";
import LiveVideoPlayer from "@/element/live-video-player";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { extractStreamInfo } from "@/utils";
import { NostrLink } from "@snort/system";
import { useReactions } from "@snort/system-react";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { StreamTimer } from "@/element/stream-time";
import { LIVE_STREAM_CHAT, LIVE_STREAM_RAID, LIVE_STREAM_CLIP } from "@/const";
import { DashboardRaidButton } from "./button-raid";
import { DashboardZapColumn } from "./column-zaps";
import { DashboardChatList } from "./chat-list";
import { DashboardStatsCard } from "./stats-card";
import { DashboardCard } from "./card";
import { NewStreamDialog } from "@/element/new-stream";
import { DashboardSettingsButton } from "./button-settings";
import DashboardIntro from "./intro";

export function DashboardForLink({ link }: { link: NostrLink }) {
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
  if (!streamLink) return <DashboardIntro />;

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
          <div className="grid gap-2 grid-cols-3">
            <DashboardRaidButton link={streamLink} />
            <NewStreamDialog ev={streamEvent} text={<FormattedMessage defaultMessage="Edit Stream Info" />} />
            <DashboardSettingsButton ev={streamEvent} />
          </div>
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
