import { useEffect, useState } from "react";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { AccountResponse, NostrStreamProvider } from "@/providers";
import { DefaultButton, Layer2Button } from "@/element/buttons";
import { Icon } from "@/element/icon";
import { StreamProviderConfig, useStreamProvider } from "@/hooks/stream-provider";
import Modal from "@/element/modal";
import CapabilityPill from "@/element/capability-pill";
import Pill from "@/element/pill";
import { useDiscoverProviders } from "@/hooks/discover-providers";
import { useLogin } from "@/hooks/login";
import { Profile } from "@/element/profile";

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
        {providers.map(c => (
          <ProviderRow config={c} active={isCurrentProvider(c)} onSelect={() => updateStreamProvider(c)} />
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-layer-2">
        <Layer2Button onClick={onClose}>
          <FormattedMessage defaultMessage="Close" />
        </Layer2Button>
      </div>
    </div>
  );
}

function ProviderRow({
  config,
  active,
  onSelect,
}: {
  config: StreamProviderConfig;
  active: boolean;
  onSelect: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [account, setAccount] = useState<AccountResponse>();
  const { formatMessage } = useIntl();
  const login = useLogin();

  const getPriceRange = (endpoints?: Array<{ cost?: { rate?: number; unit?: string } }>) => {
    if (!endpoints || endpoints.length === 0) return "N/A";

    const rates = endpoints.filter(ep => ep.cost?.rate !== undefined).map(ep => ep.cost!.rate ?? 0);

    if (rates.length === 0) return "N/A";

    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const unit = endpoints.find(ep => ep.cost?.unit)?.cost?.unit || "min";

    return min === max ? `${min} sats/${unit}` : `${min}-${max} sats/${unit}`;
  };

  useEffect(() => {
    const p = new NostrStreamProvider(config.name, config.url, login?.publisher());
    setLoading(true);
    p.info()
      .then(i => {
        setAccount(i);
        setLoading(false);
      })
      .catch(e => {
        if (e instanceof Error) {
          setError(e.message);
        }
        setLoading(false);
      });
  }, [login?.pubkey]);

  return (
    <div className={`bg-layer-1 rounded-xl border p-4 ${active ? "border-primary" : "border-layer-2"}`}>
      <div className="flex justify-between mb-3">
        <div>
          <Profile pubkey={config.pubkey} />
          <div className="flex items-center gap-2 mt-2">
            <h3 className="font-semibold">{config.name}</h3>
            {active && (
              <span className="text-xs bg-primary text-black px-2 py-1 rounded-full">
                <FormattedMessage defaultMessage="Current" />
              </span>
            )}
          </div>
          <div className="text-layer-5 text-sm">{config.description}</div>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-layer-5 text-sm">{new URL(config.url).host}</span>
          {!active && !loading && !error && (
            <DefaultButton onClick={() => onSelect()}>
              <FormattedMessage defaultMessage="Select" />
            </DefaultButton>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-layer-4">
          <FormattedMessage defaultMessage="Loading provider information..." />
        </div>
      )}

      {error && (
        <div className="text-warning">
          <FormattedMessage defaultMessage="Error: {error}" values={{ error: error }} />
        </div>
      )}

      {account && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-layer-4 mb-1">
              <FormattedMessage defaultMessage="Balance" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-mono">
                <FormattedNumber value={account.balance || 0} /> sats
              </div>
              {account.has_nwc !== undefined && (
                <div>
                  <Pill title={formatMessage({ defaultMessage: "Auto-topup with NWC" })} className="!bg-green-800">
                    NWC
                  </Pill>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-layer-4 mb-1">
              <FormattedMessage defaultMessage="TOS Status" />
            </div>
            <div className={account.tos?.accepted ? "flex gap-1 text-green-500" : "flex gap-1 text-warning"}>
              {account.tos?.accepted ? (
                <FormattedMessage defaultMessage="Accepted" />
              ) : (
                <FormattedMessage defaultMessage="Not Accepted" />
              )}
              <a href={account.tos?.link} target="_blank">
                <Icon name="link" />
              </a>
            </div>
          </div>

          <div>
            <div className="text-layer-4 mb-1">
              <FormattedMessage defaultMessage="Price Range" />
            </div>
            <div className="font-mono">{getPriceRange(account.endpoints)}</div>
          </div>

          <div>
            <div className="text-layer-4 mb-1">
              <FormattedMessage defaultMessage="Capabilities" />
            </div>
            <div className="flex flex-wrap gap-1">
              {account.endpoints
                ?.flatMap(ep => ep.capabilities || [])
                .filter((cap, index, arr) => arr.indexOf(cap) === index) // Remove duplicates
                .slice(0, 3) // Show only first 3 capabilities
                .map((capability, index) => <CapabilityPill key={index} capability={capability} />)}
              {account.endpoints?.flatMap(ep => ep.capabilities || []).length > 3 && (
                <span className="text-xs text-layer-4 self-center">
                  +{account.endpoints?.flatMap(ep => ep.capabilities || []).length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}
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
