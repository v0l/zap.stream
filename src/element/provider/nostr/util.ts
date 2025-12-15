import type { IngestEndpoint } from "@/providers";

export function sortEndpoints(arr: Array<IngestEndpoint>) {
  return arr.sort((a, b) => ((a.cost.rate ?? 0) > (b.cost.rate ?? 0) ? -1 : 1));
}
