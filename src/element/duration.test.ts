import { describe, expect, it } from "bun:test"
import { splitDuration } from "./duration"

describe("splitDuration", () => {
  it("splits seconds into days, hours and minutes", () => {
    expect(splitDuration(17128.4 * 60)).toEqual({ days: 11, hours: 21, minutes: 28 })
  })

  it("drops seconds below a minute", () => {
    expect(splitDuration(59)).toEqual({ days: 0, hours: 0, minutes: 0 })
  })

  it("treats negative input as zero", () => {
    expect(splitDuration(-30)).toEqual({ days: 0, hours: 0, minutes: 0 })
  })
})
