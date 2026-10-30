import { useState } from "react"
import { FormattedMessage } from "react-intl"
import { DefaultButton } from "@/element/buttons"
import { Icon } from "@/element/icon"
import { type StreamProviderConfig, useStreamProvider } from "@/hooks/stream-provider"
import Modal from "@/element/modal"
import { useDiscoverProviders } from "@/hooks/discover-providers"
import { ProviderCard } from "@/element/provider-card"

export function ProviderSelector() {
  const { config: currentConfig, updateStreamProvider } = useStreamProvider()
  const providers = useDiscoverProviders()

  const isCurrentProvider = (providerConfig: StreamProviderConfig) => {
    return currentConfig.name === providerConfig.name && currentConfig.url === providerConfig.url
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-layer-5 text-sm">
        <FormattedMessage defaultMessage="Choose your preferred streaming provider. Each provider may have different pricing, features, and terms of service." />
      </p>

      <div className="grid gap-4">
        {providers.slice(0, 3).map(c => (
          <ProviderCard
            key={`${c.name}-${c.url}`}
            config={c}
            active={isCurrentProvider(c)}
            onSelect={() => updateStreamProvider(c)}
          />
        ))}
      </div>

      <a href="/providers" className="text-primary text-sm flex items-center gap-2">
        <FormattedMessage defaultMessage="View all providers" />
        <Icon name="external-link" size={16} />
      </a>
    </div>
  )
}

export function ProviderSelectorButton() {
  const [show, setShow] = useState(false)

  return (
    <>
      <DefaultButton onClick={() => setShow(true)}>
        <FormattedMessage defaultMessage="Select Provider" />
      </DefaultButton>
      {show && (
        <Modal
          id="provider-selector"
          title={<FormattedMessage defaultMessage="Select Stream Provider" />}
          onClose={() => setShow(false)}
        >
          <ProviderSelector />
        </Modal>
      )}
    </>
  )
}
