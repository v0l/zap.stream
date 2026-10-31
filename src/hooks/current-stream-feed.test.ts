import { expect, test } from "bun:test"
import { NostrPrefix } from "@snort/shared"
import { NostrLink, type TaggedNostrEvent } from "@snort/system"
import { pickCurrentStream } from "./current-stream-feed"

const host = "a".repeat(64)
function stream(d: string, status: string, created_at: number): TaggedNostrEvent {
  return {
    id: d.padEnd(64, "0"),
    pubkey: host,
    kind: 30311,
    created_at,
    tags: [
      ["d", d],
      ["status", status],
    ],
    content: "",
    sig: "",
    relays: [],
  }
}

test("widgets follow the live stream when a newer planned or ended event exists", () => {
  const link = new NostrLink(NostrPrefix.PublicKey, host)
  const live = stream("live", "live", 100)
  const planned = stream("next-week", "planned", 200)
  const ended = stream("old", "ended", 150)
  expect(pickCurrentStream(link, [planned, live, ended])?.id).toBe(live.id)
})

test("with nothing live the newest event is used", () => {
  const link = new NostrLink(NostrPrefix.PublicKey, host)
  const ended = stream("old", "ended", 150)
  const planned = stream("next-week", "planned", 200)
  expect(pickCurrentStream(link, [ended, planned])?.id).toBe(planned.id)
})
