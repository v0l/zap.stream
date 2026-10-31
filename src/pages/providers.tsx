import { FormattedMessage } from "react-intl"
import { type StreamProviderConfig, useStreamProvider } from "@/hooks/stream-provider"
import { useDiscoverProviders } from "@/hooks/discover-providers"
import { ProviderCard } from "@/element/provider-card"

export default function ProvidersPage() {
  const { config: currentConfig, updateStreamProvider } = useStreamProvider()
  const providers = useDiscoverProviders()

  const isCurrentProvider = (providerConfig: StreamProviderConfig) => {
    return currentConfig.name === providerConfig.name && currentConfig.url === providerConfig.url
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:px-8 sm:py-7 max-w-[1560px]">
      <div className="flex flex-col gap-1">
        <h1 className="text-[clamp(24px,2.6vw,34px)] leading-tight">
          <FormattedMessage defaultMessage="Stream Providers" />
        </h1>
        <p className="text-layer-4">
          <FormattedMessage defaultMessage="Choose your preferred streaming provider. Each provider may have different pricing, features, and terms of service." />
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {providers.map(c => (
          <ProviderCard
            key={`${c.name}-${c.url}`}
            config={c}
            active={isCurrentProvider(c)}
            onSelect={() => updateStreamProvider(c)}
            showRecommendations={true}
          />
        ))}
      </div>
    </div>
  )
}
