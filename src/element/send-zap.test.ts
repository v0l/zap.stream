import { describe, expect, test } from "bun:test"
import { bech32 } from "@scure/base"
import { amountWithinLNURLBounds, invoiceMatchesAmount } from "../invoice"

function convertBits(data: number[], from: number, to: number): number[] {
  let acc = 0, bits = 0
  const ret: number[] = []
  for (const v of data) {
    acc = (acc << from) | v
    bits += from
    while (bits >= to) {
      bits -= to
      ret.push((acc >> bits) & ((1 << to) - 1))
    }
  }
  if (bits) ret.push((acc << (to - bits)) & ((1 << to) - 1))
  return ret
}
function tagged(tag: number, data: number[]): number[] {
  return [tag, (data.length >> 5) & 31, data.length & 31, ...data]
}
function makeBolt11(amountMsat: number | undefined): string {
  const ts = Math.floor(Date.now() / 1000)
  const payhash = Array.from({ length: 32 }, (_, i) => (i * 7 + 13) & 0xff)
  const descBytes = Array.from("audit-poc-fake-invoice").map(c => c.charCodeAt(0))
  let hrp = "lnbc"
  if (amountMsat !== undefined) {
    let amt = amountMsat * 10
    let unit = "p"
    for (const u of ["n", "u", "m"]) {
      if (amt % 1000 === 0) {
        amt /= 1000
        unit = u
      }
    }
    hrp += `${amt}${unit}`
  }
  const tsGroups = Array.from({ length: 7 }, (_, i) => Math.floor(ts / 2 ** (30 - 5 * i)) & 31)
  const data = [
    ...tsGroups,
    ...tagged(1, convertBits(payhash, 8, 5)),
    ...tagged(13, convertBits(descBytes, 8, 5)),
    ...Array(104).fill(0),
  ]
  return bech32.encode(hrp, data, false)
}

describe("invoiceMatchesAmount", () => {
  test("accepts an invoice for the requested amount", () => {
    expect(invoiceMatchesAmount(makeBolt11(21_000), 21)).toBe(true)
    expect(invoiceMatchesAmount(makeBolt11(1_000_000_000), 1_000_000)).toBe(true)
  })
  test("rejects an invoice for a different amount", () => {
    expect(invoiceMatchesAmount(makeBolt11(1_000_000_000), 21)).toBe(false)
    expect(invoiceMatchesAmount(makeBolt11(1_000), 0)).toBe(false)
  })
  test("returns undefined for zero-amount invoices (cannot verify)", () => {
    expect(invoiceMatchesAmount(makeBolt11(undefined), 21)).toBeUndefined()
  })
  test("returns undefined for undecodable invoices (cannot verify — must not auto-pay)", () => {
    expect(invoiceMatchesAmount("lnbc1garbage", 21)).toBeUndefined()
    expect(invoiceMatchesAmount("", 21)).toBeUndefined()
  })
  test("matches floored msat amounts (LNURL sends Math.floor(sats*1000))", () => {
    expect(invoiceMatchesAmount(makeBolt11(21_500), 21.5)).toBe(true)
    expect(invoiceMatchesAmount(makeBolt11(21_000), 21.5)).toBe(false)
  })
  test("bolt11 case-insensitivity: uppercase invoices decode and verify", () => {
    expect(invoiceMatchesAmount(makeBolt11(21_000).toUpperCase(), 21)).toBe(true)
    expect(invoiceMatchesAmount(makeBolt11(1_000_000_000).toUpperCase(), 21)).toBe(false)
  })
})

describe("amountWithinLNURLBounds", () => {
  test("amounts inside advertised bounds pass (incl. exact edges)", () => {
    expect(amountWithinLNURLBounds(21_000, 1_000, 100_000_000)).toBe(true)
    expect(amountWithinLNURLBounds(1_000, 1_000, 100_000_000)).toBe(true) // exactly at min
    expect(amountWithinLNURLBounds(100_000_000, 1_000, 100_000_000)).toBe(true) // exactly at max
  })
  test("amounts outside advertised bounds fail", () => {
    expect(amountWithinLNURLBounds(500, 1_000, 100_000_000)).toBe(false) // below min
    expect(amountWithinLNURLBounds(200_000_000, 1_000, 100_000_000)).toBe(false) // above max
  })
  test("unadvertised bounds cannot be checked", () => {
    expect(amountWithinLNURLBounds(21_000, undefined, undefined)).toBeUndefined()
  })
  test("non-finite amounts cannot be checked", () => {
    expect(amountWithinLNURLBounds(Number.NaN, 1_000, 100_000_000)).toBeUndefined()
  })
})
