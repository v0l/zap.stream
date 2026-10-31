import { FormattedMessage } from "react-intl"
import StepHeader from "./step-header"
import { DefaultButton, PrimaryButton } from "@/element/buttons"
import { useStreamProvider } from "@/hooks/stream-provider"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { AddForwardInputs } from "@/element/provider/nostr/fowards"
import type { ForwardDest } from "@/providers"

export default function DashboardIntroStep3() {
  const navigate = useNavigate()
  const location = useLocation()
  const [forwards, setForwards] = useState<Array<ForwardDest>>([])
  const { provider: streamProvider } = useStreamProvider()

  async function loadInfo() {
    streamProvider.info().then(i => {
      setForwards(i.forwards ?? [])
    })
  }

  useEffect(() => {
    loadInfo()
  }, [])

  return (
    <div className="mx-auto flex flex-col items-center w-full max-w-[30rem] p-4 sm:py-8">
      <StepHeader />
      <div className="flex flex-col gap-4 w-full">
        <h2>
          <FormattedMessage defaultMessage="Stream Forwarding (optional)" />
        </h2>
        <p className="text-layer-5">
          <FormattedMessage defaultMessage="This allows you to forward your stream to other platforms to reach a wider audience." />
          <br />
          <FormattedMessage defaultMessage="To get started, grab your stream key from the platform you wish to forward to." />
        </p>

        {forwards && forwards.length > 0 && (
          <ul className="flex flex-col divide-y divide-layer-3 rounded-xl border border-layer-3">
            {forwards.map(a => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="truncate">{a.name}</span>
                <DefaultButton
                  onClick={async () => {
                    await streamProvider.removeForward(a.id)
                    await loadInfo()
                  }}
                >
                  <FormattedMessage defaultMessage="Remove" id="G/yZLu" />
                </DefaultButton>
              </li>
            ))}
          </ul>
        )}
        <AddForwardInputs provider={streamProvider} onAdd={loadInfo} />
        <PrimaryButton
          className="!py-2.5"
          onClick={async () => {
            navigate("/dashboard/step-4", {
              state: location.state,
            })
          }}
        >
          <FormattedMessage defaultMessage="Continue" />
        </PrimaryButton>
      </div>
    </div>
  )
}
