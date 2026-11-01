import { DefaultButton, PrimaryButton } from "@/element/buttons"
import Modal from "@/element/modal"
import { invoiceMatchesAmount } from "@/invoice"
import type { NostrStreamProvider } from "@/providers"
import { LNURL } from "@snort/shared"
import { useEffect, useState } from "react"
import { FormattedMessage, useIntl } from "react-intl"

export default function AccountWithdrawl({
  provider,
  onFinish,
}: {
  provider: NostrStreamProvider
  onFinish: () => void
}) {
  const [topup, setTopup] = useState(false)
  const [addr, setAddress] = useState("")
  const [error, setError] = useState("")
  const [amount, setAmount] = useState<number>()
  const [withdrawalSupported, setWithdrawalSupported] = useState<boolean | null>(null)
  const { formatMessage } = useIntl()

  // Check if withdrawal is supported by making a HEAD request
  useEffect(() => {
    const checkWithdrawalSupport = async () => {
      try {
        const withdrawUrl = `${provider.url}withdraw`
        const response = await fetch(withdrawUrl, {
          method: "HEAD",
        })

        // If we get 200, 400, 401, 405, or 403, the endpoint exists
        // If we get 404, the endpoint doesn't exist (not supported)
        setWithdrawalSupported(response.status !== 404)
      } catch (_error) {
        // On network error, assume it's supported to avoid breaking existing functionality
        setWithdrawalSupported(false)
      }
    }

    checkWithdrawalSupport()
  }, [provider.url])

  useEffect(() => {
    if (addr.startsWith("lnbc") && amount !== undefined) {
      setAmount(undefined)
    } else if (!addr.startsWith("lnbc") && amount === undefined) {
      setAmount(0)
    }
  }, [addr, amount])

  async function withdraw() {
    setError("")
    let invoice = addr
    if (!invoice.startsWith("lnbc") && amount && amount > 1) {
      const invoiceError = formatMessage({
        defaultMessage: "Failed to get invoice",
      })
      try {
        const lnurl = new LNURL(addr)
        await lnurl.load()
        const rsp = await lnurl.getInvoice(amount, "Withdrawal from zap.stream")
        if (rsp.pr) {
          // The service controls the invoice contents; only forward it when it
          // provably carries the amount the user requested (fail closed).
          if (invoiceMatchesAmount(rsp.pr, amount) !== true) {
            setError(
              formatMessage({ defaultMessage: "Invoice amount does not match the requested withdrawal amount" }),
            )
            return
          }
          invoice = rsp.pr
        } else {
          setError(rsp.reason ?? invoiceError)
          return
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message)
        } else {
          setError(invoiceError)
        }
        return
      }
    }

    try {
      const res = await provider.withdraw(invoice)
      if (res.preimage) {
        setTopup(false)
        onFinish()
      } else if (res.error) {
        setError(res.error)
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message)
      }
    }
  }

  // Don't render if withdrawal is not supported
  if (!withdrawalSupported) {
    return null
  }

  return (
    <>
      <DefaultButton onClick={() => setTopup(true)}>
        <FormattedMessage defaultMessage="Withdraw" />
      </DefaultButton>
      {topup && (
        <Modal
          id="withdraw"
          size="sm"
          title={<FormattedMessage defaultMessage="Withdraw funds" />}
          onClose={() => setTopup(false)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <small className="text-layer-4">
                <FormattedMessage defaultMessage="Destination" />
              </small>
              <input
                type="text"
                value={addr}
                onChange={e => setAddress(e.target.value)}
                placeholder={formatMessage({
                  defaultMessage: "LNURL or invoice",
                })}
              />
            </div>
            {amount !== undefined && (
              <div className="flex flex-col gap-1">
                <small className="text-layer-4">
                  <FormattedMessage defaultMessage="Amount" />
                </small>
                <input type="number" value={amount} onChange={e => setAmount(e.target.valueAsNumber)} />
              </div>
            )}
            <PrimaryButton disabled={addr.length < 3} onClick={withdraw}>
              <FormattedMessage defaultMessage="Withdraw" />
            </PrimaryButton>
            {error && <b className="text-warning">{error}</b>}
          </div>
        </Modal>
      )}
    </>
  )
}
