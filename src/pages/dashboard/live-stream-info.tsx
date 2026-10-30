import BalanceTimeEstimate from "@/element/balance-time-estimate"
import AccountTopup from "@/element/provider/nostr/topup"
import LiveVideoPlayer from "@/element/stream/live-video-player"
import { StreamTimer } from "@/element/stream/stream-time"
import type { AccountResponse, MetricsMessage, NostrStreamProvider } from "@/providers"
import type { NostrEvent } from "@snort/system"
import { useState, useEffect, useMemo } from "react"
import { FormattedMessage, FormattedNumber } from "react-intl"
import BalanceHistoryModal from "./balance-history"
import { DashboardSettingsButton } from "./button-settings"
import { ProviderSelectorButton } from "./provider-selector"
import { DashboardStatsCard } from "./stats-card"
import { DashboardCard } from "./card"
import { useStream } from "@/element/stream/stream-state"
import { useLogin } from "@/hooks/login"
import { CompactMetricsDisplay } from "./realtime-metrics"

export function DashboardLiveStreamInfo({ provider }: { provider: NostrStreamProvider }) {
  const { link, event, info: streamInfo } = useStream()
  const login = useLogin()
  const isMyManual = event?.pubkey === login?.pubkey
  const [info, setInfo] = useState<AccountResponse>()
  const [maxParticipants, setMaxParticipants] = useState(0)
  const [metrics, setMetrics] = useState<MetricsMessage>()
  const id = streamInfo?.id

  const defaultEndpoint = useMemo(() => {
    const metricsEndpint = metrics?.data?.endpoint_name ?? "Best"
    return info?.endpoints?.find(a => a.name === metricsEndpint) ?? info?.endpoints?.at(0)
  }, [info, metrics])

  useEffect(() => {
    if (!isMyManual) {
      let cancelled = false
      const load = () => {
        provider
          .info()
          .then(i => {
            if (!cancelled) setInfo(i)
          })
          .catch(() => {})
      }
      load()
      const t = setInterval(load, 1000 * 60)
      return () => {
        cancelled = true
        clearInterval(t)
      }
    }
  }, [isMyManual, provider.url])

  useEffect(() => {
    if (id) {
      provider.subscribeToMetrics(id, m => {
        if (m.type === "StreamMetrics") {
          setMetrics(m)
        }
      })
      return () => provider.unsubscribeFromMetrics(id)
    }
  }, [id, provider])

  const participants = metrics?.data?.viewers ? metrics?.data?.viewers : Number(streamInfo?.participants)
  useEffect(() => {
    if (participants) {
      setMaxParticipants(v => (v < Number(participants) ? Number(participants) : v))
    }
  }, [participants])

  if (!link) return
  return (
    <>
      <DashboardCard flush>
        <LiveVideoPlayer
          stream={streamInfo?.stream}
          link={link}
          status={streamInfo?.status}
          poster={streamInfo?.image ?? streamInfo?.thumbnail}
          muted={true}
          className="w-full rounded-t-2xl overflow-hidden"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-layer-3">
          {metrics ? (
            <CompactMetricsDisplay metrics={metrics} />
          ) : (
            <span className="text-sm text-layer-4">
              <FormattedMessage defaultMessage="Waiting for stream health" />
            </span>
          )}
        </div>
      </DashboardCard>
      <DashboardCard>
        <div className="flex gap-6">
          <DashboardStatsCard
            name={<FormattedMessage defaultMessage="Live for" />}
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
          <DashboardStatsCard
            name={<FormattedMessage defaultMessage="Watching" />}
            value={<FormattedNumber value={Number(participants) || 0} />}
          />
          <DashboardStatsCard
            name={<FormattedMessage defaultMessage="Peak" />}
            value={<FormattedNumber value={maxParticipants} />}
          />
        </div>
      </DashboardCard>
      {defaultEndpoint && (
        <DashboardCard
          title={<FormattedMessage defaultMessage="Balance" />}
          headerAction={
            <AccountTopup
              provider={provider}
              onFinish={() => {
                provider.info().then(setInfo)
              }}
            />
          }
        >
          <div className="flex flex-col">
            <span className="font-display text-2xl font-extrabold">
              <BalanceTimeEstimate balance={info?.balance ?? 0} endpoint={defaultEndpoint} />
            </span>
            <span className="text-sm text-layer-4">
              <FormattedMessage
                defaultMessage="left at {rate} sats per {unit}, {balance} sats in your account"
                values={{
                  balance: <FormattedNumber value={info?.balance ?? 0} />,
                  rate: defaultEndpoint.cost.rate ?? 0,
                  unit: defaultEndpoint.cost.unit ?? "min",
                }}
              />
            </span>
          </div>
          <div className="flex gap-2 flex-wrap pt-3 border-t border-layer-3">
            <BalanceHistoryModal provider={provider} />
            <DashboardSettingsButton ev={event} provider={provider} />
            <ProviderSelectorButton />
          </div>
        </DashboardCard>
      )}
    </>
  )
}
