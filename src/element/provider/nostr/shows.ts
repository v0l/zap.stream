import { StreamState } from "@/const"
import type { CreateStreamKeyRequest, PatchStreamRequest, StreamKeyItem } from "@/providers"
import { extractStreamInfo } from "@/utils"
import type { NostrEvent } from "@snort/system"

export interface ScheduleForm {
  title: string
  summary: string
  image: string
  tags: Array<string>
  starts: Date
}

export type ShowAction = "reschedule" | "edit" | "delete"

export interface Show {
  keyId: string
  key: string
  streamId?: string
  title: string
  state: StreamState
  starts?: number
  event?: NostrEvent
}

export function buildScheduleRequest(form: ScheduleForm): CreateStreamKeyRequest {
  const event: CreateStreamKeyRequest["event"] = { title: form.title.trim() }
  const summary = form.summary.trim()
  const image = form.image.trim()
  const tags = form.tags.map(t => t.trim()).filter(t => t.length > 0)
  if (summary) event.summary = summary
  if (image) event.image = image
  if (tags.length > 0) event.tags = tags
  return { event, status: "planned", starts: form.starts.toISOString() }
}

export function buildRescheduleRequest(streamId: string, starts: Date): PatchStreamRequest {
  return { id: streamId, status: "planned", starts: starts.toISOString() }
}

export function actionsFor(state: StreamState): Array<ShowAction> {
  switch (state) {
    case StreamState.Ended:
      return ["reschedule", "edit", "delete"]
    case StreamState.Planned:
      return ["edit", "delete"]
    default:
      return ["edit"]
  }
}

export function toShow(item: StreamKeyItem): Show {
  const event = item.stream as unknown as NostrEvent | undefined
  const info = event ? extractStreamInfo(event) : undefined
  const state = (info?.status as StreamState | undefined) ?? StreamState.Planned
  const starts = info?.starts ? Number(info.starts) : undefined
  return {
    keyId: String(item.id),
    key: item.key,
    streamId: item.stream_id ?? info?.id,
    title: info?.title ?? "",
    state,
    starts: Number.isFinite(starts) ? starts : undefined,
    event,
  }
}

export function sortShows(shows: Array<Show>): Array<Show> {
  const rank = (s: Show) => (s.state === StreamState.Live ? 0 : s.state === StreamState.Planned ? 1 : 2)
  return [...shows].sort((a, b) => {
    const r = rank(a) - rank(b)
    if (r !== 0) return r
    const as = a.starts ?? 0
    const bs = b.starts ?? 0
    return a.state === StreamState.Planned ? as - bs : bs - as
  })
}

export function toLocalInput(date: Date): string {
  const p = (n: number) => n.toString().padStart(2, "0")
  return `${date.getFullYear().toString().padStart(4, "0")}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`
}

export function isFutureStart(value: string, now = new Date()): boolean {
  const d = new Date(value)
  return !Number.isNaN(d.getTime()) && d.getTime() > now.getTime()
}
