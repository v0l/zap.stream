import { useEffect, useRef, useState, type FormEvent } from "react"
import { FormattedMessage, useIntl } from "react-intl"
import { RemoteSigner } from "@/remote-signer"
import { PrimaryButton } from "./buttons"
import QrCode from "./qr-code"
import Copy from "./copy"

export function RemoteLogin({ onConnect }: { onConnect: (signer: RemoteSigner) => void }) {
  const [bunker, setBunker] = useState("")
  const [relay, setRelay] = useState("wss://relay.primal.net")
  const [uri, setUri] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const attempt = useRef<AbortController | null>(null)
  const { formatMessage } = useIntl()

  useEffect(() => () => attempt.current?.abort(), [])

  async function connect(qr: boolean) {
    attempt.current?.abort()
    const controller = new AbortController()
    attempt.current = controller
    setBusy(true)
    setError("")
    setUri("")
    try {
      const options = { signal: controller.signal }
      let signer: RemoteSigner
      if (qr) {
        const pairing = RemoteSigner.pair(relay, window.location.origin, options)
        setUri(pairing.uri)
        signer = await pairing.connected
      } else {
        signer = await RemoteSigner.connect(bunker, options)
      }
      if (controller.signal.aborted) {
        signer.close()
        return
      }
      // The login store now owns the signer; leaving this screen must keep it.
      attempt.current = null
      try {
        onConnect(signer)
      } catch (error) {
        signer.close()
        attempt.current = controller
        throw error
      }
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : String(error))
    } finally {
      if (attempt.current === controller) {
        attempt.current = null
        setBusy(false)
        setUri("")
      }
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void connect(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-layer-5">
        <FormattedMessage defaultMessage="Connect Signet or another remote signer. Your Nostr private key stays in your signer. This browser remembers its connection until you log out." />
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label htmlFor="bunker-link">
          <FormattedMessage defaultMessage="Bunker link" />
        </label>
        <input
          id="bunker-link"
          type="password"
          autoComplete="off"
          placeholder="bunker://…"
          value={bunker}
          onChange={e => setBunker(e.target.value)}
          disabled={busy}
        />
        <PrimaryButton type="submit" disabled={busy || !bunker.trim()}>
          <FormattedMessage defaultMessage="Connect signer" />
        </PrimaryButton>
      </form>
      <details>
        <summary className="cursor-pointer">
          <FormattedMessage defaultMessage="Pair by QR code instead" />
        </summary>
        <div className="flex flex-col gap-3 pt-3">
          <label htmlFor="signer-relay">
            <FormattedMessage defaultMessage="Pairing relay" />
          </label>
          <input
            id="signer-relay"
            type="url"
            autoComplete="off"
            value={relay}
            onChange={e => setRelay(e.target.value)}
            disabled={busy}
          />
          <PrimaryButton onClick={() => connect(true)} disabled={busy}>
            <FormattedMessage defaultMessage="Create pairing code" />
          </PrimaryButton>
        </div>
      </details>
      {uri && (
        <div className="flex flex-col items-center gap-3">
          <QrCode data={uri} />
          <p>
            <FormattedMessage defaultMessage="Scan this code with your signer, or copy the connection link and paste it there. Approve the connection in your signer." />
          </p>
          <Copy text={uri} maxSize={24} />
          <textarea
            readOnly
            aria-label={formatMessage({ defaultMessage: "Signer connection link" })}
            value={uri}
            className="w-full text-xs break-all"
          />
        </div>
      )}
      {busy && (
        <div role="status" className="flex flex-col gap-3">
          <FormattedMessage defaultMessage="Waiting for your signer…" />
          <button
            type="button"
            onClick={() => {
              attempt.current?.abort()
              attempt.current = null
              setBusy(false)
              setUri("")
            }}
          >
            <FormattedMessage defaultMessage="Cancel connection" />
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-warning">
          {error}
        </p>
      )}
    </div>
  )
}
