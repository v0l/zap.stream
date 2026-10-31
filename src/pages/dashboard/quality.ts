import type { IngestEndpoint } from "@zap.stream/api"

export function endpointLabel(ep: IngestEndpoint) {
  return ep.name.replace(/^rtmps?-/i, "")
}

export function endpointTopQuality(ep: IngestEndpoint) {
  const heights = ep.capabilities
    .map(c => c.split(":"))
    .filter(([tag]) => tag === "variant")
    .map(([, h]) => h)
  if (heights.length === 0) return
  const numeric = heights.map(h => Number.parseInt(h, 10)).filter(Number.isFinite)
  if (numeric.length === 0) return "source"
  return `${Math.max(...numeric)}p`
}

export function satsPerHour(ep: IngestEndpoint) {
  const rate = ep.cost.rate ?? 0
  return ep.cost.unit === "min" ? rate * 60 : rate
}

export function hoursOfStreaming(balance: number, ep: IngestEndpoint) {
  const perHour = satsPerHour(ep)
  if (perHour <= 0) return
  return Math.max(0, balance) / perHour
}

export function pickEndpoint(endpoints: Array<IngestEndpoint>, saved: string | null) {
  return endpoints.find(a => a.name === saved) ?? [...endpoints].sort((a, b) => satsPerHour(b) - satsPerHour(a))[0]
}
