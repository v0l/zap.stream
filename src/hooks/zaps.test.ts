import { expect, test } from "bun:test"
import { NostrPrefix } from "@snort/shared"
import { NostrLink, RequestBuilder, type TaggedNostrEvent } from "@snort/system"
import { repliesTo, zapsRequest } from "./zaps"

test("zap receipts are fetched from every relay, not only the one the stream was seen on", () => {
  const stream: TaggedNostrEvent = {
    id: "1".repeat(64),
    pubkey: "a".repeat(64),
    kind: 30311,
    created_at: 1,
    tags: [["d", "live"]],
    content: "",
    sig: "",
    relays: ["wss://relay.snort.social/"],
  }
  const [filter] = zapsRequest(NostrLink.fromEvent(stream), true).buildRaw()
  expect(filter.relays).toBeUndefined()
  expect(filter.kinds).toEqual([9735])
  expect(filter["#a"]).toEqual([`30311:${"a".repeat(64)}:live`])
})

test("stream chat is fetched from every relay when the stream lists none", () => {
  const link = new NostrLink(NostrPrefix.Address, "live", 30311, "a".repeat(64), ["wss://relay.snort.social/"])
  const rb = new RequestBuilder("chat")
  repliesTo(rb, [link])
  const [filter] = rb.buildRaw()
  expect(filter.relays).toBeUndefined()
  expect(filter["#a"]).toEqual([`30311:${"a".repeat(64)}:live`])
})
