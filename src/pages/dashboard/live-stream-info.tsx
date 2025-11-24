import BalanceTimeEstimate from "@/element/balance-time-estimate";
import { NewStreamDialog } from "@/element/new-stream";
import AccountTopup from "@/element/provider/nostr/topup";
import LiveVideoPlayer from "@/element/stream/live-video-player";
import { StreamTimer } from "@/element/stream/stream-time";
import { AccountResponse, MetricsMessage, NostrStreamProvider } from "@/providers";
import { NostrEvent } from "@snort/system";
import { useState, useEffect, useMemo } from "react";
import { FormattedMessage, FormattedNumber } from "react-intl";
import BalanceHistoryModal from "./balance-history";
import { DashboardRaidButton } from "./button-raid";
import { DashboardSettingsButton } from "./button-settings";
import { ProviderSelectorButton } from "./provider-selector";
import { DashboardStatsCard } from "./stats-card";
import { useStream } from "@/element/stream/stream-state";
import { useLogin } from "@/hooks/login";
import { LIVE_STREAM } from "@/const";
import { CompactMetricsDisplay } from "./realtime-metrics";

export function DashboardLiveStreamInfo({ provider }: { provider: NostrStreamProvider }) {
  const { link, event, info: streamInfo } = useStream();
  const login = useLogin();
  const isMyManual = event?.pubkey === login?.pubkey;
  const [info, setInfo] = useState<AccountResponse>();
  const [maxParticipants, setMaxParticipants] = useState(0);
  const [metrics, setMetrics] = useState<MetricsMessage>();
  const id = streamInfo?.id;

  const defaultEndpoint = useMemo(() => {
    const metricsEndpint = metrics?.data?.endpoint_name ?? "Best";
    return info?.endpoints?.find(a => a.name == metricsEndpint) ?? info?.endpoints?.at(0);
  }, [info, metrics]);

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
  }, [isMyManual, provider.url]);

  useEffect(() => {
    if (id) {
      provider.subscribeToMetrics(id, m => {
        if (m.type === "StreamMetrics") {
          setMetrics(m);
        }
      });
      return () => provider.unsubscribeFromMetrics(id);
    }
  }, [id, provider]);

  const participants = metrics?.data?.viewers ? metrics?.data?.viewers : Number(streamInfo?.participants);
  useEffect(() => {
    if (participants) {
      setMaxParticipants(v => (v < Number(participants) ? Number(participants) : v));
    }
  }, [participants]);

  const streamToEdit =
    event ??
    (info?.details && !isMyManual
      ? {
          id: "",
          pubkey: "",
          created_at: 0,
          sig: "",
          content: "",
          kind: LIVE_STREAM,
          tags: [
            ["d", ""],
            ["title", info.details.title ?? ""],
            ["summary", info.details?.summary ?? ""],
            ["picture", info.details.image ?? ""],
            ["service", provider.url],
            ...(info.details.tags?.map(t => ["t", t]) ?? []),
          ],
        }
      : undefined);

  if (!link) return;
  return (
    <>
      <div className="flex justify-between items-center">
        <h3>
          <FormattedMessage defaultMessage="Stream" />
        </h3>
        {metrics && <CompactMetricsDisplay metrics={metrics} />}
      </div>
      <LiveVideoPlayer
        stream={streamInfo?.stream}
        link={link}
        status={streamInfo?.status}
        poster={streamInfo?.image ?? streamInfo?.thumbnail}
        muted={true}
        className="w-full"
      />
      <div className="flex gap-4">
        <DashboardStatsCard
          name={<FormattedMessage defaultMessage="Stream Time" />}
          value={
            <StreamTimer
              ev={
                metrics?.data?.started_at
                  ? ({ tags: [["starts", new Date(metrics.data?.started_at).getTime() / 1000]] } as NostrEvent)
                  : event
              }
            />
          }
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
                rate: defaultEndpoint.cost.rate ?? 0,
                unit: defaultEndpoint.cost.unit ?? "min",
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
        <DashboardRaidButton link={link} />
        <NewStreamDialog ev={streamToEdit} text={<FormattedMessage defaultMessage="Edit Stream Info" />} />
        <DashboardSettingsButton ev={event} provider={provider} />
        <BalanceHistoryModal provider={provider} />
        <ProviderSelectorButton />
      </div>
    </>
  );
}
