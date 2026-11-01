import { expect, test } from "bun:test"
import { defaultRelays } from "@/const"
import { providerHandlersRequest } from "./discover-providers"

test("provider handler request is sent to relay.ditto.pub where Streamstr publishes its handler event", () => {
  const [filter] = providerHandlersRequest().buildRaw()
  expect(filter.relays).toContain("wss://relay.ditto.pub/")
  for (const r of Object.keys(defaultRelays)) {
    expect(filter.relays?.map(a => a.replace(/\/$/, ""))).toContain(r.replace(/\/$/, ""))
  }
})
