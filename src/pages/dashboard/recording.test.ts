import { expect, test } from "bun:test"
import { parseRecordingDefault } from "./recording"

test("stored false restores recording off", () => {
  expect(parseRecordingDefault("false")).toBe(false)
})

test("missing or true stored value means recording on", () => {
  expect(parseRecordingDefault(null)).toBe(true)
  expect(parseRecordingDefault("true")).toBe(true)
})
