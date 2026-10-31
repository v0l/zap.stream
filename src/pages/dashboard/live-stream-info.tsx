import LiveVideoPlayer from "@/element/stream/live-video-player"
import { StreamTimer } from "@/element/stream/stream-time"
import type { AccountResponse, MetricsMessage, NostrStreamProvider } from "@/providers"
import type { NostrEvent } from "@snort/system"
import { useState, useEffect, useMemo } from "react"
import { FormattedMessage, FormattedNumber } from "react-intl"
import { DashboardStatsCard } from "./stats-card"
import { DashboardCard } from "./card"
import { useStream } from "@/element/stream/stream-state"
import { useLogin } from "@/hooks/login"
import { CompactMetricsDisplay } from "./realtime-metrics"
import { DashboardWalletCard } from "./account-card"
import { pickEndpoint } from "./quality"

export function DashboardLiveStreamInfo({ provider }: { provider: NostrStreamProvider }) {
  const { link, event, info: streamInfo } = useStream()
  const login = useLogin()
  const isMyManual = event?.pubkey === login?.pubkey
  const [info, setInfo] = useState<AccountResponse>()
  const [maxParticipants, setMaxParticipants] = useState(0)
  const [metrics, setMetrics] = useState<MetricsMessage>()
  const id = streamInfo?.id

  const defaultEndpoint = useMemo(() => {
    return pickEndpoint(
      info?.endpoints ?? [],
      metrics?.data?.endpoint_name ?? localStorage.getItem("dashboard-endpoint"),
    )
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
      setMaxParticipants(v => Math.max(v, Number(participants)))
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
      <DashboardWalletCard
        provider={provider}
        info={info}
        endpoint={defaultEndpoint}
        onChange={() => provider.info().then(setInfo)}
      />
    </>
  )
}
