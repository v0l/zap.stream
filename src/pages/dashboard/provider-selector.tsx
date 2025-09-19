import { useState, useEffect } from "react";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { NostrStreamProvider, AccountResponse } from "@/providers";
import { DefaultButton, Layer1Button } from "@/element/buttons";
import { Icon } from "@/element/icon";
import { useStreamProvider } from "@/hooks/stream-provider";
import Modal from "@/element/modal";
import CapabilityPill from "@/element/capability-pill";
import Pill from "@/element/pill";

interface ProviderConfig {
  name: string;
  url: string;
  description?: string;
}

// Static array of available providers
const AVAILABLE_PROVIDERS: ProviderConfig[] = [
  {
    name: "zap.stream",
    url: "https://api-core.zap.stream/api/v1",
    description: "Official zap.stream hosting provider",
  },
  {
    name: "zap.stream (UK)",
    url: "https://api-uk.zap.stream/api/v1",
    description: "Alternative streaming server in UK",
  },
];

interface ProviderInfoDisplay {
  provider: ProviderConfig;
  info?: AccountResponse;
  loading: boolean;
  error?: string;
}

interface ProviderSelectorProps {
  onClose: () => void;
}

export function ProviderSelector({ onClose }: ProviderSelectorProps) {
  const [providers, setProviders] = useState<ProviderInfoDisplay[]>([]);
  const { config: currentConfig, updateStreamProvider } = useStreamProvider();
  const { formatMessage } = useIntl();

  useEffect(() => {
    // Initialize providers and start fetching info
    const initialProviders = AVAILABLE_PROVIDERS.map(p => ({
      provider: p,
      loading: true,
      error: undefined,
      info: undefined,
    }));
    setProviders(initialProviders);

    // Fetch info for each provider
    AVAILABLE_PROVIDERS.forEach(async (providerConfig, index) => {
      try {
        const provider = new NostrStreamProvider(providerConfig.name, providerConfig.url);
        const info = await provider.info();

        setProviders(prev => prev.map((p, i) => (i === index ? { ...p, info, loading: false } : p)));
      } catch (error) {
        setProviders(prev =>
          prev.map((p, i) =>
            i === index
              ? {
                ...p,
                loading: false,
                error: error instanceof Error ? error.message : "Failed to fetch provider info",
              }
              : p,
          ),
        );
      }
    });
  }, []);

  const handleSelectProvider = (providerConfig: ProviderConfig) => {
    updateStreamProvider({
      name: providerConfig.name,
      url: providerConfig.url,
    });
  };

  const isCurrentProvider = (providerConfig: ProviderConfig) => {
    return currentConfig.name === providerConfig.name && currentConfig.url === providerConfig.url;
  };

  const getPriceRange = (endpoints?: Array<{ cost?: { rate?: number; unit?: string } }>) => {
    if (!endpoints || endpoints.length === 0) return "N/A";

    const rates = endpoints.filter(ep => ep.cost?.rate !== undefined).map(ep => ep.cost!.rate ?? 0);

    if (rates.length === 0) return "N/A";

    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const unit = endpoints.find(ep => ep.cost?.unit)?.cost?.unit || "min";

    return min === max ? `${min} sats/${unit}` : `${min}-${max} sats/${unit}`;
  };

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2>
          <FormattedMessage defaultMessage="Select Stream Provider" />
        </h2>
        <button className="text-layer-4 hover:text-white" onClick={onClose}>
          <Icon name="close" size={24} />
        </button>
      </div>

      <p className="text-layer-5">
        <FormattedMessage defaultMessage="Choose your preferred streaming provider. Each provider may have different pricing, features, and terms of service." />
      </p>

      <div className="grid gap-4">
        {providers.map((providerDisplay, index) => (
          <div
            key={index}
            className={`bg-layer-1 rounded-xl border p-4 ${isCurrentProvider(providerDisplay.provider) ? "border-primary" : "border-layer-2"
              }`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{providerDisplay.provider.name}</h3>
                  {isCurrentProvider(providerDisplay.provider) && (
                    <span className="text-xs bg-primary text-black px-2 py-1 rounded-full">
                      <FormattedMessage defaultMessage="Current" />
                    </span>
                  )}
                </div>
                {providerDisplay.provider.description && (
                  <p className="text-layer-5 text-sm mt-1">{providerDisplay.provider.description}</p>
                )}
              </div>

              {!isCurrentProvider(providerDisplay.provider) && !providerDisplay.loading && !providerDisplay.error && (
                <DefaultButton onClick={() => handleSelectProvider(providerDisplay.provider)}>
                  <FormattedMessage defaultMessage="Select" />
                </DefaultButton>
              )}
            </div>

            {providerDisplay.loading && (
              <div className="text-layer-4">
                <FormattedMessage defaultMessage="Loading provider information..." />
              </div>
            )}

            {providerDisplay.error && (
              <div className="text-warning">
                <FormattedMessage defaultMessage="Error: {error}" values={{ error: providerDisplay.error }} />
              </div>
            )}

            {providerDisplay.info && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-layer-4 mb-1">
                    <FormattedMessage defaultMessage="Balance" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="font-mono">
                      <FormattedNumber value={providerDisplay.info.balance || 0} /> sats
                    </div>
                    {providerDisplay.info.has_nwc !== undefined && <div>
                      <Pill title={formatMessage({ defaultMessage: "Auto-topup with NWC" })} className="bg-green-800">NWC</Pill>
                    </div>}
                  </div>
                </div>

                <div>
                  <div className="text-layer-4 mb-1">
                    <FormattedMessage defaultMessage="TOS Status" />
                  </div>
                  <div className={providerDisplay.info.tos?.accepted ? "text-green-500" : "text-warning"}>
                    {providerDisplay.info.tos?.accepted ? (
                      <FormattedMessage defaultMessage="Accepted" />
                    ) : (
                      <FormattedMessage defaultMessage="Not Accepted" />
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-layer-4 mb-1">
                    <FormattedMessage defaultMessage="Price Range" />
                  </div>
                  <div className="font-mono">{getPriceRange(providerDisplay.info.endpoints)}</div>
                </div>

                <div>
                  <div className="text-layer-4 mb-1">
                    <FormattedMessage defaultMessage="Capabilities" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {providerDisplay.info.endpoints
                      ?.flatMap(ep => ep.capabilities || [])
                      .filter((cap, index, arr) => arr.indexOf(cap) === index) // Remove duplicates
                      .slice(0, 3) // Show only first 3 capabilities
                      .map((capability, index) => <CapabilityPill key={index} capability={capability} />)}
                    {providerDisplay.info.endpoints?.flatMap(ep => ep.capabilities || []).length > 3 && (
                      <span className="text-xs text-layer-4 self-center">
                        +{providerDisplay.info.endpoints?.flatMap(ep => ep.capabilities || []).length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-layer-2">
        <Layer1Button onClick={onClose}>
          <FormattedMessage defaultMessage="Close" />
        </Layer1Button>
      </div>
    </div>
  );
}

export function ProviderSelectorButton() {
  const [show, setShow] = useState(false);

  return (
    <>
      <DefaultButton onClick={() => setShow(true)}>
        <FormattedMessage defaultMessage="Select Provider" />
      </DefaultButton>
      {show && (
        <Modal id="provider-selector" onClose={() => setShow(false)}>
          <ProviderSelector onClose={() => setShow(false)} />
        </Modal>
      )}
    </>
  );
}
