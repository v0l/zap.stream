import { decodeInvoice } from "@snort/shared"

/**
 * Check a bolt11 invoice against the amount (in sats) the user asked to send.
 * true = matches, false = the LNURL service returned a different amount (do
 * not auto-pay), undefined = invoice has no amount (cannot verify).
 */
export function invoiceMatchesAmount(pr: string, amountInSats: number): boolean | undefined {
  const decoded = decodeInvoice(pr)
  if (decoded?.amount === undefined) return undefined
  return decoded.amount === amountInSats * 1000
}
