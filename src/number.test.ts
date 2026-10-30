import { describe, expect, it } from "bun:test"
import { formatSatsCompact, usdToSats } from "./number"

describe("formatSatsCompact", () => {
  it("rolls over to the next unit after rounding", () => {
    expect(formatSatsCompact(999_600)).toBe("1M")
    expect(formatSatsCompact(999_999_999)).toBe("1G")
  })
  it("keeps thousands", () => {
    expect(formatSatsCompact(2500)).toBe("3K")
  })
  it("formats values below 2000 as numbers", () => {
    expect(formatSatsCompact(1999.5)).toBe("2,000")
  })
})

describe("usdToSats", () => {
  it("converts dollars to sats", () => {
    expect(usdToSats(100, 100_000)).toBe(100_000)
    expect(usdToSats(1, 50_000)).toBe(2000)
  })
  it("returns 0 for invalid input", () => {
    expect(usdToSats(Number.NaN, 100_000)).toBe(0)
    expect(usdToSats(5, 0)).toBe(0)
  })
})
