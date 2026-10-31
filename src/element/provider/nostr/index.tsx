import { useEffect, useState } from "react"
import { FormattedMessage } from "react-intl"

import type { AccountResponse, NostrStreamProvider } from "@/providers"
import type { NostrEvent as ApiNostrEvent, StreamInfo } from "@zap.stream/api"
import { extractStreamInfo } from "@/utils"
import { StreamEditor, type StreamEditorProps } from "@/element/stream-editor"
import Spinner from "@/element/spinner"
import { DefaultButton, PrimaryButton } from "@/element/buttons"
import { AcceptTos } from "@/pages/dashboard/tos"

export default function NostrProviderDialog({
  provider,
  ...others
}: {
  provider: NostrStreamProvider
} & StreamEditorProps) {
  const [info, setInfo] = useState<AccountResponse>()
  const [tos, setTos] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setInfo(undefined)
    provider
      .info()
      .then(i => {
        if (cancelled) return
        setLoadError("")
        setInfo(i)
        setTos(i.tos?.accepted ?? true)
      })
      .catch(e => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [provider, attempt])

  if (!info) {
    if (loadError) {
      return (
        <div className="flex flex-col gap-2">
          <b className="text-warning">{loadError}</b>
          <div>
            <DefaultButton onClick={() => setAttempt(a => a + 1)}>
              <FormattedMessage defaultMessage="Retry" />
            </DefaultButton>
          </div>
        </div>
      )
    }
    return <Spinner />
  }

  if (info.tos?.accepted === false) {
    return (
      <div className="flex flex-col gap-4">
        <AcceptTos provider={provider.name} tosLink={info.tos?.link} tos={tos} setTos={setTos} />
        <PrimaryButton
          disabled={!tos}
          onClick={async () => {
            await provider.acceptTos()
            setAttempt(a => a + 1)
          }}
        >
          <FormattedMessage defaultMessage="Continue" id="acrOoz" />
        </PrimaryButton>
      </div>
    )
  }

  return (
    <>
      <StreamEditor
        onFinish={async ex => {
          try {
            await provider.updateStreamFromEvent(
              ex as unknown as ApiNostrEvent,
              extractStreamInfo as unknown as (ev: ApiNostrEvent) => StreamInfo,
            )
            setSaveError("")
            others.onFinish?.(ex)
          } catch (e) {
            setSaveError(e instanceof Error ? e.message : String(e))
          }
        }}
        ev={others.ev}
        options={{
          canSetStream: false,
          canSetStatus: false,
        }}
      />
      {saveError && <b className="text-warning">{saveError}</b>}
    </>
  )
}
