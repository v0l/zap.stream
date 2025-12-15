import { FormattedMessage } from "react-intl";
import { type StreamProviderConfig, useStreamProvider } from "@/hooks/stream-provider";
import { useDiscoverProviders } from "@/hooks/discover-providers";
import { ProviderCard } from "@/element/provider-card";

export default function ProvidersPage() {
  const { config: currentConfig, updateStreamProvider } = useStreamProvider();
  const providers = useDiscoverProviders();

  const isCurrentProvider = (providerConfig: StreamProviderConfig) => {
    return currentConfig.name === providerConfig.name && currentConfig.url === providerConfig.url;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          <FormattedMessage defaultMessage="Stream Providers" />
        </h1>
        <p className="text-layer-5 text-lg">
          <FormattedMessage defaultMessage="Choose your preferred streaming provider. Each provider may have different pricing, features, and terms of service." />
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
  );
}
