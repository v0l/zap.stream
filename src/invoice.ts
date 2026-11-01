import { decodeInvoice } from "@snort/shared"

/**
 * Check a bolt11 invoice against the amount (in sats) the user asked to send.
 * true = matches, false = the LNURL service returned a different amount (do
 * not auto-pay), undefined = the invoice could not be decoded or carries no
 * amount (do not auto-pay; let the user decide with the QR).
 *
 * Note: LNURL.getInvoice requests Math.floor(amount * 1000) msat from the
 * service, so the expected invoice amount is floored msat.
 */
export function invoiceMatchesAmount(pr: string, amountInSats: number): boolean | undefined {
  const decoded = decodeInvoice(pr)
  if (decoded?.amount === undefined) return undefined
  return decoded.amount === Math.floor(amountInSats * 1000)
}
