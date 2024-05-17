import { LiveChat } from "@/element/live-chat";
import LiveVideoPlayer from "@/element/live-video-player";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { extractStreamInfo } from "@/utils";
import { EventExt, NostrEvent, NostrLink } from "@snort/system";
import { SnortContext, useReactions } from "@snort/system-react";
import { Suspense, lazy, useContext, useEffect, useMemo, useState } from "react";
import { FormattedMessage, FormattedNumber } from "react-intl";
import { StreamTimer } from "@/element/stream-time";
import { LIVE_STREAM_CHAT, LIVE_STREAM_RAID, LIVE_STREAM_CLIP, StreamState } from "@/const";
import { DashboardRaidButton } from "./button-raid";
import { DashboardZapColumn } from "./column-zaps";
import { DashboardChatList } from "./chat-list";
import { DashboardStatsCard } from "./stats-card";
import { DashboardCard } from "./card";
import { NewStreamDialog } from "@/element/new-stream";
import { DashboardSettingsButton } from "./button-settings";
import DashboardIntro from "./intro";
import { useLocation } from "react-router-dom";
import StreamKey from "@/element/provider/nostr/stream-key";
import { DefaultProvider, NostrStreamProvider, StreamProviderInfo } from "@/providers";
import { ExternalLink } from "@/element/external-link";
import BalanceTimeEstimate from "@/element/balance-time-estimate";
import { WarningButton } from "@/element/buttons";
import { useLogin } from "@/hooks/login";
import AccountTopup from "@/element/provider/nostr/topup";
import classNames from "classnames";
import ManualStream from "./manual-stream";
import { unixNow } from "@snort/shared";
const StreamSummary = lazy(() => import("@/element/summary-chart"));

export function DashboardForLink({ link }: { link: NostrLink }) {
  const streamEvent = useCurrentStreamFeed(link, true);
  const location = useLocation();
  const login = useLogin();
  const streamLink = streamEvent ? NostrLink.fromEvent(streamEvent) : undefined;
  const { stream, status, image, participants, service } = extractStreamInfo(streamEvent);
  const [info, setInfo] = useState<StreamProviderInfo>();
  const isMyManual = streamEvent?.pubkey === login?.pubkey;
  const system = useContext(SnortContext);

  const provider = useMemo(() => (service ? new NostrStreamProvider("", service) : DefaultProvider), [service]);
  const defaultEndpoint = useMemo(() => {
    return info?.endpoints.find(a => a.name == "Good");
  }, [info]);

  useEffect(() => {
    if (!isMyManual) {
      provider.info().then(setInfo);
      const t = setInterval(() => {
        provider.info().then(setInfo);
      }, 1000 * 60);
      return () => {
        clearInterval(t);
      };
    }
  }, [isMyManual, provider]);

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

  if (!streamLink && !location.search.includes("setupComplete=true")) return <DashboardIntro />;

  return (
    <div
      className={classNames("grid gap-2 h-[calc(100dvh-52px)]", {
        "grid-cols-3": status === StreamState.Live,
        "grid-cols-[20%_80%]": status === StreamState.Ended,
      })}>
      <div className="min-h-0 h-full grid grid-rows-[min-content_auto] gap-2">
        <DashboardCard className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3>
              <FormattedMessage defaultMessage="Stream" id="uYw2LD" />
            </h3>
            <div className="uppercase font-semibold flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  status === StreamState.Live ? "animate-pulse bg-green-500" : "bg-red-500"
                }`}></div>
              {status === StreamState.Live ? (
                <FormattedMessage defaultMessage="Started" />
              ) : (
                <FormattedMessage defaultMessage="Stopped" />
              )}
            </div>
          </div>
          {streamLink && status === StreamState.Live && !isMyManual && (
            <>
              <LiveVideoPlayer stream={stream} status={status} poster={image} muted={true} className="w-full" />
              <div className="flex gap-4">
                <DashboardStatsCard
                  name={<FormattedMessage defaultMessage="Stream Time" />}
                  value={<StreamTimer ev={streamEvent} />}
                />
                <DashboardStatsCard name={<FormattedMessage defaultMessage="Viewers" />} value={participants} />
                <DashboardStatsCard name={<FormattedMessage defaultMessage="Top Viewers" />} value={maxParticipants} />
              </div>
              {defaultEndpoint && (
                <div className="bg-layer-1 rounded-xl px-4 py-3 flex justify-between items-center text-layer-5">
                  <div>
                    <FormattedMessage
                      defaultMessage="{estimate} remaining ({balance} sats @ {rate} sats / {unit})"
                      values={{
                        estimate: (
                          <span className="text-white">
                            <BalanceTimeEstimate balance={info?.balance ?? 0} endpoint={defaultEndpoint} />
                          </span>
                        ),
                        balance: <FormattedNumber value={info?.balance ?? 0} />,
                        rate: defaultEndpoint.rate ?? 0,
                        unit: defaultEndpoint.unit ?? "min",
                      }}
                    />
                  </div>
                  <AccountTopup
                    provider={provider}
                    onFinish={() => {
                      provider.info().then(setInfo);
                    }}
                  />
                </div>
              )}
              <div className="grid gap-2 grid-cols-3">
                <DashboardRaidButton link={streamLink} />
                <NewStreamDialog ev={streamEvent} text={<FormattedMessage defaultMessage="Edit Stream Info" />} />
                <DashboardSettingsButton ev={streamEvent} />
              </div>
            </>
          )}
          {streamLink && isMyManual && status === StreamState.Live && (
            <>
              <LiveVideoPlayer stream={stream} status={status} poster={image} muted={true} className="w-full" />
              <div className="grid gap-2 grid-cols-3">
                <DashboardRaidButton link={streamLink} />
                <NewStreamDialog ev={streamEvent} text={<FormattedMessage defaultMessage="Edit Stream Info" />} />
                <WarningButton
                  onClick={async () => {
                    //todo: clean this up
                    const copy = streamEvent ? ({ ...streamEvent } as NostrEvent) : undefined;
                    const statusTag = copy?.tags.find(a => a[0] === "status");
                    const endedTag = copy?.tags.find(a => a[0] === "ends");
                    const pub = login?.signer();
                    if (statusTag && copy && pub) {
                      statusTag[1] = StreamState.Ended;
                      if (endedTag) {
                        endedTag[1] = String(unixNow());
                      } else {
                        copy.tags.push(["ends", String(unixNow())]);
                      }
                      copy.created_at = unixNow();
                      copy.id = EventExt.createId(copy);
                      const evPub = await pub.sign(copy);
                      if (evPub) {
                        await system.BroadcastEvent(evPub);
                      }
                    }
                  }}>
                  <FormattedMessage defaultMessage="End Stream" />
                </WarningButton>
              </div>
            </>
          )}
          {(!streamLink || status === StreamState.Ended) && (
            <>
              <div className="bg-layer-1 rounded-xl aspect-video flex items-center justify-center uppercase text-warning font-semibold">
                <FormattedMessage defaultMessage="Offline" />
              </div>
              <NewStreamDialog ev={streamEvent} text={<FormattedMessage defaultMessage="Edit Stream Info" />} />
              <div className="flex flex-col gap-4">
                <h3>
                  <FormattedMessage defaultMessage="Stream Setup" />
                </h3>
                <p className="text-layer-5">
                  <FormattedMessage
                    defaultMessage="To go live, copy and paste your Server URL and Stream Key below into your streaming software settings and press 'Start Streaming'. We recommend <a>OBS</a>."
                    values={{
                      a: c => <ExternalLink href="https://obsproject.com/">{c}</ExternalLink>,
                    }}
                  />
                </p>
                {defaultEndpoint && <StreamKey ep={defaultEndpoint} />}
                <ManualStream />
              </div>
            </>
          )}
        </DashboardCard>
        {streamLink && status === StreamState.Live && (
          <DashboardCard className="flex flex-col gap-4">
            <h3>
              <FormattedMessage defaultMessage="Chat Users" />
            </h3>
            <div className="h-[calc(100%-4rem)] overflow-y-auto">
              <DashboardChatList feed={feed} />
            </div>
          </DashboardCard>
        )}
      </div>
      {streamLink && status === StreamState.Live && (
        <>
          <DashboardZapColumn ev={streamEvent!} link={streamLink} feed={feed} />
          <LiveChat link={streamLink} ev={streamEvent} className="min-h-0 border border-layer-2 rounded-xl px-4 py-3" />
        </>
      )}
      {streamLink && status === StreamState.Ended && (
        <>
          <DashboardCard className="overflow-y-auto">
            <h1>
              <FormattedMessage defaultMessage="Last Stream Summary" />
            </h1>
            <Suspense>
              <StreamSummary link={streamLink} />
            </Suspense>
          </DashboardCard>
        </>
      )}
    </div>
  );
}
