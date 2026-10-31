import { useState } from "react"
import { FormattedMessage } from "react-intl"
import classNames from "classnames"
import type { AccountResponse, NostrStreamProvider } from "@/providers"
import { DefaultButton, Layer2Button } from "@/element/buttons"
import { Icon } from "@/element/icon"
import Modal from "@/element/modal"
import { ModalSection } from "@/element/modal-section"
import { AddForwardInputs } from "@/element/provider/nostr/fowards"
import StreamKeyList from "@/element/provider/nostr/stream-keys"
import NwcConfig from "@/element/provider/nostr/nwc-config"
import { ProviderSelector } from "./provider-selector"

export type SettingsTab = "forwarding" | "keys" | "topup" | "provider"

export function DashboardSettingsButton({
  provider,
  info,
  onChange,
}: {
  provider: NostrStreamProvider
  info?: AccountResponse
  onChange: () => void
}) {
  const [tab, setTab] = useState<SettingsTab>()
  return (
    <>
      <DefaultButton onClick={() => setTab("forwarding")}>
        <Icon name="settings" size={16} />
        <FormattedMessage defaultMessage="Settings" />
      </DefaultButton>
      {tab && (
        <DashboardSettingsModal
          tab={tab}
          setTab={setTab}
          provider={provider}
          info={info}
          onChange={onChange}
          onClose={() => setTab(undefined)}
        />
      )}
    </>
  )
}

export function DashboardSettingsModal({
  tab,
  setTab,
  provider,
  info,
  onChange,
  onClose,
}: {
  tab: SettingsTab
  setTab: (t: SettingsTab) => void
  provider: NostrStreamProvider
  info?: AccountResponse
  onChange: () => void
  onClose: () => void
}) {
  const tabs: Array<{ id: SettingsTab; label: React.ReactNode }> = [
    { id: "forwarding", label: <FormattedMessage defaultMessage="Restream" /> },
    { id: "keys", label: <FormattedMessage defaultMessage="Stream keys" /> },
    { id: "topup", label: <FormattedMessage defaultMessage="Auto topup" /> },
    { id: "provider", label: <FormattedMessage defaultMessage="Provider" /> },
  ]
  return (
    <Modal id="dashboard-settings" title={<FormattedMessage defaultMessage="Settings" />} onClose={onClose}>
      <div role="tablist" className="flex gap-1 overflow-x-auto scrollbar-hidden -mx-1 px-1 border-b border-layer-2">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={classNames(
              "px-3 pb-2.5 pt-1 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px cursor-pointer",
              tab === t.id ? "border-primary text-text" : "border-transparent text-layer-4 hover:text-text",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "forwarding" && <ForwardingTab provider={provider} info={info} onChange={onChange} />}
      {tab === "keys" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-layer-5">
            <FormattedMessage defaultMessage="Each extra key gets its own stream page, so you can run more than one stream at a time or keep a fixed link for a show." />
          </p>
          <StreamKeyList provider={provider} />
        </div>
      )}
      {tab === "topup" &&
        (info?.has_nwc !== undefined ? (
          <NwcConfig provider={provider} hasNwc={info.has_nwc} onConfigured={onChange} />
        ) : (
          <p className="text-sm text-layer-4">
            <FormattedMessage defaultMessage="This provider does not support automatic topups." />
          </p>
        ))}
      {tab === "provider" && <ProviderSelector />}
    </Modal>
  )
}

function ForwardingTab({
  provider,
  info,
  onChange,
}: {
  provider: NostrStreamProvider
  info?: AccountResponse
  onChange: () => void
}) {
  const forwards = info?.forwards ?? []
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-layer-5">
        <FormattedMessage defaultMessage="Send your stream to Twitch, YouTube and other platforms at the same time as zap.stream." />
      </p>
      {forwards.length > 0 && (
        <ModalSection title={<FormattedMessage defaultMessage="Sending to" />}>
          <ul className="flex flex-col divide-y divide-layer-2 rounded-xl border border-layer-2">
            {forwards.map(a => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="truncate">{a.name}</span>
                <Layer2Button
                  onClick={async () => {
                    await provider.removeForward(a.id)
                    onChange()
                  }}
                >
                  <FormattedMessage defaultMessage="Remove" />
                </Layer2Button>
              </li>
            ))}
          </ul>
        </ModalSection>
      )}
      <ModalSection title={<FormattedMessage defaultMessage="Add a destination" />}>
        <AddForwardInputs provider={provider} onAdd={onChange} />
      </ModalSection>
    </div>
  )
}
