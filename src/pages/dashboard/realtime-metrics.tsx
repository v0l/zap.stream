import { FormattedMessage } from "react-intl";
import type { MetricsMessage } from "@/providers/zsz";

export function CompactMetricsDisplay({ metrics }: { metrics: MetricsMessage }) {
  const getBitrate = (): number | undefined => {
    const endpointStats = metrics.data?.endpoint_stats;
    return endpointStats ? Object.values(endpointStats)[0]?.bitrate : undefined;
  };

  const getStreamHealth = (avgFps?: number, targetFps?: number) => {
    if (!avgFps || !targetFps) return { status: "unknown", color: "bg-gray-500", text: "Unknown" };

    const fpsRatio = avgFps / targetFps;

    if (fpsRatio >= 0.95) {
      return { status: "excellent", color: "bg-green-500", text: "Excellent" };
    } else if (fpsRatio >= 0.85) {
      return { status: "good", color: "bg-green-400", text: "Good" };
    } else if (fpsRatio >= 0.75) {
      return { status: "fair", color: "bg-yellow-500", text: "Fair" };
    } else if (fpsRatio >= 0.6) {
      return { status: "poor", color: "bg-orange-500", text: "Poor" };
    } else {
      return { status: "critical", color: "bg-red-500", text: "Critical" };
    }
  };

  if (!metrics.data) {
    return (
      <div className="uppercase font-semibold flex items-center gap-2">
        <div className="w-3 h-3 rounded-full animate-pulse bg-green-500"></div>
        <FormattedMessage defaultMessage="Started" />
      </div>
    );
  }

  const health = getStreamHealth(metrics.data.average_fps, metrics.data.target_fps);
  const bitrate = getBitrate();

  return (
    <div className="uppercase font-semibold flex items-center gap-3">
      <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${health.color} flex items-center gap-1`}>
        <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-pulse"></div>
        {health.text}
      </div>
      {metrics.data.average_fps && (
        <span>
          {metrics.data.average_fps.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
          FPS
        </span>
      )}
      {bitrate && <span>{Math.round(bitrate / 1000).toLocaleString()} kbps</span>}
      {!metrics.data.average_fps && !bitrate && <FormattedMessage defaultMessage="Started" />}
    </div>
  );
}
