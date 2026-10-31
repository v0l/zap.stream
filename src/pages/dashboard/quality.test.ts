import { expect, test } from "bun:test"
import type { IngestEndpoint } from "@zap.stream/api"
import { endpointLabel, endpointTopQuality, hoursOfStreaming, pickEndpoint, satsPerHour } from "./quality"

function ep(name: string, rate: number, capabilities: Array<string>, unit = "min"): IngestEndpoint {
  return { name, url: `rtmp://in/${name}`, key: "k", capabilities, cost: { unit, rate } }
}

const good = ep("RTMP-Good", 2.5, ["variant:2160:20000000", "variant:1440:12000000", "variant:720:4000000"])
const basic = ep("RTMP-Basic", 0.01, ["variant:source"])

test("labels drop the protocol prefix", () => {
  expect(endpointLabel(good)).toBe("Good")
  expect(endpointLabel(ep("Best", 1, []))).toBe("Best")
})

test("top quality is the highest variant, or source passthrough", () => {
  expect(endpointTopQuality(good)).toBe("2160p")
  expect(endpointTopQuality(basic)).toBe("source")
  expect(endpointTopQuality(ep("x", 1, []))).toBeUndefined()
})

test("picks the saved endpoint, else the dearest one", () => {
  expect(pickEndpoint([basic, good], "RTMP-Basic")).toBe(basic)
  expect(pickEndpoint([basic, good], "Best")).toBe(good)
  expect(pickEndpoint([basic, good], null)).toBe(good)
  expect(pickEndpoint([], null)).toBeUndefined()
})

test("hours of streaming from balance and per-minute rate", () => {
  expect(satsPerHour(good)).toBe(150)
  expect(hoursOfStreaming(123_456, good)).toBeCloseTo(823.04, 2)
  expect(hoursOfStreaming(0, good)).toBe(0)
  expect(hoursOfStreaming(100, ep("free", 0, []))).toBeUndefined()
})
