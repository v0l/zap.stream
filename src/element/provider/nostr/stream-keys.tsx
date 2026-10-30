import type { StreamState } from "@/const"
import { Layer2Button } from "@/element/buttons"
import Copy from "@/element/copy"
import { StatePill } from "@/element/state-pill"
import type { NostrStreamProvider } from "@/providers"
import type { StreamKeysResult } from "@/providers"
import { eventLink, extractStreamInfo } from "@/utils"
import type { NostrEvent } from "@snort/system"
import { useEffect, useState } from "react"
import { FormattedMessage } from "react-intl"
import { Link } from "react-router"
import { ModalSection } from "@/element/modal-section"

export default function StreamKeyList({ provider }: { provider: NostrStreamProvider }) {
  const [keys, setKeys] = useState<StreamKeysResult>()
  const [error, setError] = useState("")

  async function loadKeys() {
    try {
      const k = await provider.streamKeys()
      setKeys(Array.isArray(k) ? { items: k, page: 0, pageSize: 1000 } : k)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  useEffect(() => {
    loadKeys()
  }, [])

  return (
    <ModalSection
      title={
        <span className="flex items-center justify-between">
          <FormattedMessage defaultMessage="Stream Keys" />
        </span>
      }
    >
      {keys && keys.items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-layer-2">
          <table className="w-full text-sm">
            <thead className="text-left text-layer-4">
              <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-medium">
                <th>
                  <FormattedMessage defaultMessage="Created" />
                </th>
                <th>
                  <FormattedMessage defaultMessage="Expires" />
                </th>
                <th>
                  <FormattedMessage defaultMessage="Key" />
                </th>
                <th>
                  <FormattedMessage defaultMessage="Stream" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-layer-2 border-t border-layer-2">
              {keys.items.map(a => (
                <tr key={a.id} className="[&>td]:px-3 [&>td]:py-2">
                  <td>{new Date(a.created * 1000).toLocaleString()}</td>
                  <td>{a.expires && new Date(a.expires * 1000).toLocaleString()}</td>
                  <td>
                    <Copy text={a.key} hideText={true} />
                  </td>
                  <td>
                    {a.stream && (
                      <Link to={`/${eventLink(a.stream as unknown as NostrEvent)}`}>
                        <StatePill state={extractStreamInfo(a.stream as unknown as NostrEvent).status as StreamState} />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {keys?.items.length === 0 && (
        <p className="text-sm text-layer-4">
          <FormattedMessage defaultMessage="No keys" />
        </p>
      )}
      <Layer2Button
        className="self-start"
        onClick={async () => {
          try {
            setError("")
            await provider.createStreamKey()
            await loadKeys()
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e))
          }
        }}
      >
        <FormattedMessage defaultMessage="New stream key" />
      </Layer2Button>
      {error && <b className="text-warning">{error}</b>}
    </ModalSection>
  )
}
