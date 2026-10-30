import { FormattedMessage } from "react-intl"
import type { MetricsMessage } from "@/providers"

export function CompactMetricsDisplay({ metrics }: { metrics: MetricsMessage }) {
  const getBitrate = (): number | undefined => {
    const endpointStats = metrics.data?.endpoint_stats
    return endpointStats ? Object.values(endpointStats)[0]?.bitrate : undefined
  }

  const getStreamHealth = (avgFps?: number, targetFps?: number) => {
    if (!avgFps || !targetFps) return { status: "unknown", color: "bg-gray-500", text: "Unknown" }

    const fpsRatio = avgFps / targetFps

    if (fpsRatio >= 0.95) {
      return { status: "excellent", color: "bg-green-500", text: "Excellent" }
    } else if (fpsRatio >= 0.85) {
      return { status: "good", color: "bg-green-400", text: "Good" }
    } else if (fpsRatio >= 0.75) {
      return { status: "fair", color: "bg-yellow-500", text: "Fair" }
    } else if (fpsRatio >= 0.6) {
      return { status: "poor", color: "bg-orange-500", text: "Poor" }
    } else {
      return { status: "critical", color: "bg-red-500", text: "Critical" }
    }
  }

  if (!metrics.data) {
    return (
      <div className="text-sm font-semibold flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <FormattedMessage defaultMessage="Started" />
      </div>
    )
  }

  const health = getStreamHealth(metrics.data.average_fps, metrics.data.target_fps)
  const bitrate = getBitrate()

  return (
    <div className="text-sm font-semibold flex items-center gap-3 tabular-nums">
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${health.color}`}></div>
        {health.text}
      </div>
      {metrics.data.average_fps && (
        <span className="text-layer-4">
          {metrics.data.average_fps.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
          FPS
        </span>
      )}
      {bitrate && <span className="text-layer-4">{Math.round(bitrate / 1000).toLocaleString()} kbps</span>}
      {!metrics.data.average_fps && !bitrate && <FormattedMessage defaultMessage="Started" />}
    </div>
  )
}
