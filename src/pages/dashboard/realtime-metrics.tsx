import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { NostrStreamProvider, MetricsMessage } from "@/providers/zsz";

interface MetricsData {
  streamMetrics?: {
    viewers?: number;
    fps?: number;
    targetFps?: number;
    frameCount?: number;
    resolution?: string;
    bitrate?: number;
  };
  connected: boolean;
  lastUpdate?: Date;
}

export function CompactMetricsDisplay({ streamId, provider }: { streamId?: string; provider?: NostrStreamProvider }) {
  const [metrics, setMetrics] = useState<MetricsData>({ connected: false });
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">(
    "disconnected",
  );

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

  useEffect(() => {
    if (!streamId || !provider) return;

    setConnectionStatus("connecting");

    const handleMetrics = (data: MetricsMessage) => {
      if (data.type === "AuthResponse") {
        setConnectionStatus("connected");
      } else if (data.type === "StreamMetrics") {
        // Extract bitrate from endpoint_stats (RTMP, etc.)
        const endpointStats = data.data?.endpoint_stats;
        const bitrate = endpointStats ? Object.values(endpointStats)[0]?.bitrate : undefined;

        setMetrics(prev => ({
          ...prev,
          streamMetrics: {
            viewers: data.data?.viewers,
            fps: data.data?.average_fps,
            targetFps: data.data?.target_fps,
            frameCount: data.data?.frame_count,
            resolution: data.data?.input_resolution,
            bitrate: bitrate,
          },
          connected: true,
          lastUpdate: new Date(),
        }));
      }
    };

    // Subscribe to metrics via provider
    provider.subscribeToMetrics(streamId, handleMetrics);

    return () => {
      provider.unsubscribeFromMetrics(streamId);
    };
  }, [streamId, provider]);

  if (connectionStatus !== "connected" || (!metrics.streamMetrics?.fps && !metrics.streamMetrics?.bitrate)) {
    return (
      <div className="uppercase font-semibold flex items-center gap-2">
        <div className="w-3 h-3 rounded-full animate-pulse bg-green-500"></div>
        <FormattedMessage defaultMessage="Started" />
      </div>
    );
  }

  const health = getStreamHealth(metrics.streamMetrics.fps, metrics.streamMetrics.targetFps);

  return (
    <div className="uppercase font-semibold flex items-center gap-3">
      <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${health.color} flex items-center gap-1`}>
        <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-pulse"></div>
        {health.text}
      </div>
      {metrics.streamMetrics.fps && (
        <span>
          {metrics.streamMetrics.fps.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
          FPS
        </span>
      )}
      {metrics.streamMetrics.bitrate && (
        <span>{Math.round(metrics.streamMetrics.bitrate / 1000).toLocaleString()} kbps</span>
      )}
      {!metrics.streamMetrics.fps && !metrics.streamMetrics.bitrate && <FormattedMessage defaultMessage="Started" />}
    </div>
  );
}
