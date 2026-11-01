import { expect, test } from "bun:test"
import { defaultRelays } from "@/const"
import { providerDiscoveryRelays } from "./discover-providers"

test("provider discovery queries relay.ditto.pub where Streamstr publishes its handler event", () => {
  const relays = providerDiscoveryRelays()
  expect(relays).toContain("wss://relay.ditto.pub")
  for (const r of Object.keys(defaultRelays)) {
    expect(relays).toContain(r)
  }
})
