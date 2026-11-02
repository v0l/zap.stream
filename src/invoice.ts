import { decodeInvoice } from "@snort/shared"

/**
 * Check a bolt11 invoice against the amount (in sats) the user asked to send.
 * true = matches, false = different amount, undefined = no amount / undecodable.
 */
export function invoiceMatchesAmount(pr: string, amountInSats: number): boolean | undefined {
  const decoded = decodeInvoice(pr)
  if (decoded?.amount === undefined) return undefined
  return decoded.amount === Math.floor(amountInSats * 1000)
}
