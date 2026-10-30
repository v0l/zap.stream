import { useEffect, useState } from "react"
import { FormattedMessage } from "react-intl"

import type { AccountResponse, IngestEndpoint, NostrStreamProvider } from "@/providers"
import type { NostrEvent as ApiNostrEvent, StreamInfo } from "@zap.stream/api"
import { extractStreamInfo } from "@/utils"
import { SendZaps } from "@/element/send-zap"
import { StreamEditor, type StreamEditorProps } from "@/element/stream-editor"
import Spinner from "@/element/spinner"
import { useRates } from "@/hooks/rates"
import { DefaultButton, Layer2Button } from "@/element/buttons"
import { ModalSection } from "@/element/modal-section"
import { AddForwardInputs } from "./fowards"
import AccountTopup from "./topup"
import AccountWithdrawl from "./withdraw"
import BalanceHistory from "./history"
import StreamKeyList from "./stream-keys"
import NwcConfig from "./nwc-config"
import { sortEndpoints } from "./util"
import { StreamEndpoints } from "./endpoints"

export default function NostrProviderDialog({
  provider,
  showEndpoints,
  showEditor,
  showBalance,
  showEstimate,
  showForwards,
  showBalanceHistory,
  showStreamKeys,
  showNwc,
  ...others
}: {
  provider: NostrStreamProvider
  showEndpoints: boolean
  showBalance?: boolean
  showEstimate?: boolean
  showEditor: boolean
  showForwards: boolean
  showBalanceHistory: boolean
  showStreamKeys: boolean
  showNwc?: boolean
} & StreamEditorProps) {
  const [topup, setTopup] = useState(false)
  const [info, setInfo] = useState<AccountResponse>()
  const [ep, setEndpoint] = useState<IngestEndpoint>()
  const [hrs, setHrs] = useState(25)
  const [tos, setTos] = useState(false)
  const rate = useRates("BTCUSD")

  const [loadError, setLoadError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [attempt, setAttempt] = useState(0)

  async function loadInfo(isCancelled: () => boolean = () => false) {
    try {
      const info = await provider.info()
      if (isCancelled()) return
      setLoadError("")
      setInfo(info)
      setTos(info.tos?.accepted ?? true)
      setEndpoint(sortEndpoints(info.endpoints)[0])
    } catch (e) {
      if (!isCancelled()) {
        setLoadError(e instanceof Error ? e.message : String(e))
      }
    }
  }
  useEffect(() => {
    let cancelled = false
    setInfo(undefined)
    loadInfo(() => cancelled)
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

  if (topup) {
    return (
      <SendZaps
        lnurl={{
          name: provider.name,
          canZap: false,
          maxCommentLength: 0,
          getInvoice: async amount => {
            const pr = await provider.topup(amount)
            return { pr }
          },
        }}
        onFinish={() => {
          provider.info().then(v => {
            setInfo(v)
            setTopup(false)
          })
        }}
      />
    )
  }

  function calcEstimate() {
    if (!ep?.cost.rate || !ep?.cost.unit || !info?.balance) return

    const raw = Math.max(0, info.balance / ep.cost.rate)
    if (ep.cost.unit === "min" && raw > 60) {
      const pm = (Number.isFinite(hrs) ? hrs : 0) * 60 * ep.cost.rate
      return (
        <>
          <FormattedMessage
            defaultMessage="About {hours} hours of streaming at {rate} sats/{unit}."
            values={{ hours: (raw / 60).toFixed(0), rate: ep.cost.rate, unit: ep.cost.unit }}
          />
          <br />
          <FormattedMessage
            defaultMessage="Streaming {hrs} hours a month costs {sats} sats{usd}."
            values={{
              hrs: Number.isFinite(hrs) ? hrs : 0,
              sats: pm.toLocaleString(),
              usd: Number.isFinite(rate.ask) ? ` ($${(rate.ask * pm * 1e-8).toFixed(2)})` : "",
            }}
          />
          <br />
          <label className="mt-2 inline-flex items-center gap-2 rounded-lg bg-layer-2 pl-3 w-fit">
            <FormattedMessage defaultMessage="Hours per month" />
            <input
              type="number"
              className="reset w-16 bg-transparent py-1.5 pr-3 text-right"
              value={hrs}
              onChange={e => setHrs(e.target.valueAsNumber)}
            />
          </label>
        </>
      )
    }
    return (
      <FormattedMessage
        defaultMessage="About {amount} {unit} of streaming at {rate} sats/{unit}."
        values={{ amount: raw.toFixed(0), rate: ep.cost.rate, unit: ep.cost.unit }}
      />
    )
  }

  async function acceptTos() {
    await provider.acceptTos()
    const i = await provider.info()
    setInfo(i)
  }

  function tosInput() {
    if (!info) return

    return (
      <>
        <div>
          <div className="flex gap-2">
            <input type="checkbox" checked={tos} onChange={e => setTos(e.target.checked)} />
            <p>
              <FormattedMessage
                defaultMessage="I have read and agree with {provider}'s {terms}."
                id="RJOmzk"
                values={{
                  provider: provider.name,
                  terms: (
                    <button
                      type="button"
                      className="tos-link"
                      onClick={() => window.open(info.tos?.link, "popup", "width=400,height=800")}
                    >
                      <FormattedMessage defaultMessage="terms and conditions" id="thsiMl" />
                    </button>
                  ),
                }}
              />
            </p>
          </div>
        </div>
        <div>
          <DefaultButton disabled={!tos} onClick={acceptTos}>
            <FormattedMessage defaultMessage="Continue" id="acrOoz" />
          </DefaultButton>
        </div>
      </>
    )
  }

  function currentBalance() {
    if (!info) return
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-layer-0 border border-layer-2 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-sm text-layer-4">
              <FormattedMessage defaultMessage="Balance" />
            </span>
            <span className="font-display text-3xl font-bold tabular-nums">
              {info.balance?.toLocaleString() ?? 0}
              <span className="ml-1.5 text-base font-semibold text-primary">sats</span>
            </span>
          </div>
          <div className="flex gap-2">
            <AccountTopup provider={provider} onFinish={() => loadInfo()} />
            <AccountWithdrawl provider={provider} onFinish={() => loadInfo()} />
          </div>
        </div>
        {showEstimate && <div className="text-sm text-layer-5 leading-relaxed">{calcEstimate()}</div>}
      </div>
    )
  }

  function streamEditor() {
    if (!info || !showEditor) return
    if (info.tos?.accepted === false) {
      return tosInput()
    }

    return (
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
    )
  }

  function forwardInputs() {
    if (!info || !showForwards) return

    return (
      <div className="flex flex-col gap-3">
        {(info.forwards?.length ?? 0) > 0 && (
          <ul className="flex flex-col divide-y divide-layer-2 rounded-xl border border-layer-2">
            {info.forwards?.map(a => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="truncate">{a.name}</span>
                <Layer2Button
                  onClick={async () => {
                    await provider.removeForward(a.id)
                    await loadInfo()
                  }}
                >
                  <FormattedMessage defaultMessage="Remove" id="G/yZLu" />
                </Layer2Button>
              </li>
            ))}
          </ul>
        )}
        <AddForwardInputs provider={provider} onAdd={() => loadInfo()} />
      </div>
    )
  }

  function balanceHist() {
    if (!info || !showBalanceHistory) return

    return (
      <ModalSection title={<FormattedMessage defaultMessage="Balance History" />}>
        <BalanceHistory provider={provider} />
      </ModalSection>
    )
  }

  function streamKeys() {
    if (!info || !showStreamKeys) return
    return <StreamKeyList provider={provider} />
  }

  function nwcConfig() {
    if (!info || !showNwc || info.has_nwc === undefined) return
    return <NwcConfig provider={provider} hasNwc={info.has_nwc} onConfigured={() => loadInfo()} />
  }

  return (
    <>
      {showEndpoints && (
        <ModalSection title={<FormattedMessage defaultMessage="Ingest" />}>
          <StreamEndpoints currentEndpoint={ep} info={info} setEndpoint={setEndpoint} />
        </ModalSection>
      )}
      {showBalance && currentBalance()}
      {streamEditor()}
      {saveError && <b className="text-warning">{saveError}</b>}
      {forwardInputs()}
      {balanceHist()}
      {streamKeys()}
      {nwcConfig()}
    </>
  )
}
