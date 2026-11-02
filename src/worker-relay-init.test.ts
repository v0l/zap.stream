import { expect, mock, test } from "bun:test"

mock.module("@sqlite.org/sqlite-wasm", () => ({ default: async () => ({}) }))

test("a worker relay command sent before init waits for it", async () => {
  const { RelayOwner } = await import("@snort/worker-relay/src/relay-owner")
  const relay = { init: async () => {}, close: () => {} }
  const owner = new RelayOwner({
    execute: async () => ["cached"],
    createRelay: () => relay as never,
    requestLock: async () => ({ release: () => {} }),
    createChannel: () => ({ close: () => {}, serve: () => {} }) as never,
  })

  const early = owner.execute({ id: "1", cmd: "req", args: ["REQ", "1", {}] })
  await new Promise(resolve => setTimeout(resolve, 5))
  await owner.init("relay.db")

  expect(await early).toEqual(["cached"])
})
