import { expect, test } from "bun:test"
import { EventKind, PrivateKeySigner, type NostrEvent } from "@snort/system"
import { publishFollowChange } from "./contacts"

const outside = "b".repeat(64)
const target = "c".repeat(64)

test("following keeps follows made in other clients and the existing content", async () => {
  const signer = new PrivateKeySigner("1".repeat(64))
  const pubkey = signer.getPubKey()
  const remote = {
    id: "1".repeat(64),
    sig: "",
    pubkey,
    kind: EventKind.ContactList,
    created_at: 1000,
    content: '{"wss://relay":{"read":true,"write":true}}',
    tags: [
      ["p", outside, "wss://hint", "petname"],
      ["t", "kept"],
    ],
  } as NostrEvent
  const sent: Array<NostrEvent> = []
  const system = {
    Fetch: async () => [remote],
    BroadcastEvent: async (ev: NostrEvent) => {
      sent.push(ev)
      return []
    },
  }
  await publishFollowChange({
    system: system as never,
    signer,
    pubkey,
    target,
    follow: true,
    fallbackFollows: [],
  })
  expect(sent.length).toBe(1)
  expect(sent[0].tags).toEqual([["p", outside, "wss://hint", "petname"], ["t", "kept"], ["p", target]])
  expect(sent[0].content).toBe(remote.content)
  expect(sent[0].created_at).toBeGreaterThan(remote.created_at)

  await publishFollowChange({
    system: { ...system, Fetch: async () => [sent[0]] } as never,
    signer,
    pubkey,
    target,
    follow: false,
  })
  expect(sent[1].tags).toEqual([["p", outside, "wss://hint", "petname"], ["t", "kept"]])
})
