import { decodeInvoice } from "@snort/shared"

export function invoiceMatchesAmount(pr: string, amountInSats: number): boolean | undefined {
  const decoded = decodeInvoice(pr)
  if (decoded?.amount === undefined) return undefined
  return decoded.amount === Math.floor(amountInSats * 1000)
}

/**
 * Check an amount (msat) against the LNURL service's advertised bounds
 * (minSendable/maxSendable, msat). true = within bounds (or both bounds
 * checked and inside), false = outside a known bound, undefined = neither
 * bound was advertised (cannot check).
 */
export function amountWithinLNURLBounds(
  amountMsat: number,
  minMsat: number | undefined,
  maxMsat: number | undefined,
): boolean | undefined {
  if (!Number.isFinite(amountMsat)) return undefined
  let checked = false
  if (typeof minMsat === "number") {
    if (amountMsat < minMsat) return false
    checked = true
  }
  if (typeof maxMsat === "number") {
    if (amountMsat > maxMsat) return false
    checked = true
  }
  return checked ? true : undefined
}
