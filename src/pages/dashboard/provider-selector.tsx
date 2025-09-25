import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { DefaultButton, Layer2Button } from "@/element/buttons";
import { Icon } from "@/element/icon";
import { StreamProviderConfig, useStreamProvider } from "@/hooks/stream-provider";
import Modal from "@/element/modal";
import { useDiscoverProviders } from "@/hooks/discover-providers";
import { ProviderCard } from "@/element/provider-card";

interface ProviderSelectorProps {
  onClose: () => void;
}

export function ProviderSelector({ onClose }: ProviderSelectorProps) {
  const { config: currentConfig, updateStreamProvider } = useStreamProvider();
  const providers = useDiscoverProviders();

  const isCurrentProvider = (providerConfig: StreamProviderConfig) => {
    return currentConfig.name === providerConfig.name && currentConfig.url === providerConfig.url;
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
        {providers.slice(0, 3).map(c => (
          <ProviderCard
            key={`${c.name}-${c.url}`}
            config={c}
            active={isCurrentProvider(c)}
            onSelect={() => updateStreamProvider(c)}
          />
        ))}
      </div>

      <div className="pt-4 border-t border-layer-2">
        <a href="/providers" className="text-primary hover:text-primary-dark text-sm flex items-center gap-2">
          <FormattedMessage defaultMessage="View all providers" />
          <Icon name="external-link" size={16} />
        </a>
      </div>

      <div className="flex justify-end pt-4 border-t border-layer-2">
        <Layer2Button onClick={onClose}>
          <FormattedMessage defaultMessage="Close" />
        </Layer2Button>
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
