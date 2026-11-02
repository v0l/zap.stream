import { decodeInvoice } from "@snort/shared"

export function invoiceMatchesAmount(pr: string, amountInSats: number): boolean | undefined {
  const decoded = decodeInvoice(pr)
  if (decoded?.amount === undefined) return undefined
  return decoded.amount === Math.floor(amountInSats * 1000)
}
