import { useContext, useEffect, useState } from "react";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { AccountResponse, NostrStreamProvider } from "@/providers";
import { DefaultButton, Layer2Button } from "@/element/buttons";
import { Icon } from "@/element/icon";
import { StreamProviderConfig } from "@/hooks/stream-provider";
import CapabilityPill from "@/element/capability-pill";
import Pill from "@/element/pill";
import { useLogin } from "@/hooks/login";
import { Profile } from "@/element/profile";
import { NostrLink, EventKind } from "@snort/system";
import useWoT from "@/hooks/wot";
import Modal from "@/element/modal";
import { SnortContext } from "@snort/system-react";

interface ProviderCardProps {
  config: StreamProviderConfig;
  active: boolean;
  onSelect: () => void;
  showRecommendations?: boolean;
}

export function ProviderCard({ config, active, onSelect, showRecommendations = false }: ProviderCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [account, setAccount] = useState<AccountResponse>();
  const [isRecommending, setIsRecommending] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [recommendContent, setRecommendContent] = useState("");
  const [pingTime, setPingTime] = useState<number | null>(null);
  const [pingError, setPingError] = useState(false);
  const { formatMessage } = useIntl();
  const login = useLogin();
  const wot = useWoT();
  const system = useContext(SnortContext);

  // Check if current user has already recommended this provider
  const hasRecommended = config.recommendations.some(event => event.pubkey === login?.pubkey);

  const openRecommendModal = () => {
    setRecommendContent(`I recommend ${config.name} as a streaming provider`);
    setShowRecommendModal(true);
  };

  const measurePing = async () => {
    try {
      const startTime = performance.now();
      const response = await fetch(`${config.url}/time`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      const endTime = performance.now();

      if (response.ok) {
        setPingTime(Math.round(endTime - startTime));
        setPingError(false);
      } else {
        setPingError(true);
      }
    } catch (err) {
      setPingError(true);
    }
  };

  const handleRecommend = async () => {
    if (!login?.publisher() || !config.event || !recommendContent.trim()) return;

    setIsRecommending(true);
    try {
      const ev = await login.publisher()?.generic(eb => {
        return eb
          .kind(31989 as EventKind)
          .content(recommendContent.trim())
          .tag(["d", EventKind.LiveEvent.toString()])
          .tag(NostrLink.fromEvent(config.event!).toEventTag()!);
      });
      if (ev) {
        system.BroadcastEvent(ev);
      }
      setShowRecommendModal(false);
      setRecommendContent("");
    } catch (err) {
      console.error("Failed to recommend provider:", err);
    } finally {
      setIsRecommending(false);
    }
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

  useEffect(() => {
    const p = new NostrStreamProvider(config.name, config.url, login?.publisher());
    setLoading(true);

    p.info()
      .then(i => {
        setAccount(i);
        setLoading(false);
        // Measure ping after account info is loaded
        measurePing();
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
      <div className="flex justify-between">
        <Profile pubkey={config.pubkey} />
        {showRecommendations && (
          <>
            {login?.pubkey && config.event && !hasRecommended && (
              <DefaultButton
                onClick={openRecommendModal}
                className="!bg-transparent !border-primary !text-primary hover:!bg-primary hover:!text-black">
                <Icon name="heart" size={16} />
                <FormattedMessage defaultMessage="Recommend" />
              </DefaultButton>
            )}
            {login?.pubkey && hasRecommended && (
              <div className="flex items-center gap-1 text-primary text-sm">
                <Icon name="heart-solid" size={16} />
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mt-2">
            <h3 className="font-semibold text-base">{config.name}</h3>
            {active && (
              <span className="bg-primary text-black rounded-full text-xs px-2 py-1">
                <FormattedMessage defaultMessage="Current" />
              </span>
            )}
          </div>
          <div className="text-layer-5 text-sm">{config.description}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-layer-5">{new URL(config.url).host}</span>
            {pingTime !== null && !pingError && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  pingTime < 100
                    ? "bg-green-800 text-green-100"
                    : pingTime < 300
                      ? "bg-yellow-800 text-yellow-100"
                      : "bg-red-800 text-red-100"
                }`}>
                {pingTime}ms
              </span>
            )}
            {pingError && <span className="text-xs px-2 py-1 rounded-full bg-red-800 text-red-100">timeout</span>}
          </div>
          <div className="flex gap-2">
            {!active && !loading && !error && (
              <DefaultButton onClick={() => onSelect()}>
                <FormattedMessage defaultMessage="Select" />
              </DefaultButton>
            )}
          </div>
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
            <div
              className={
                account.tos?.accepted
                  ? "flex gap-1 items-center text-green-500"
                  : "flex gap-1 items-center text-warning"
              }>
              {account.tos?.accepted ? (
                <FormattedMessage defaultMessage="Accepted" />
              ) : (
                <FormattedMessage defaultMessage="Not Accepted" />
              )}
              <a href={account.tos?.link} target="_blank" rel="noopener noreferrer">
                <Icon name="link" size={14} />
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
                .filter((cap, index, arr) => arr.indexOf(cap) === index)
                .slice(0, 3)
                .map((capability, index) => <CapabilityPill key={index} capability={capability} />)}
              {account.endpoints?.flatMap(ep => ep.capabilities || []).length > 3 && (
                <span className="text-layer-4 self-center text-xs">
                  +{account.endpoints?.flatMap(ep => ep.capabilities || []).length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {showRecommendations && config.recommendations.length > 0 && (
        <div className="border-t border-layer-2 pt-4 mt-4">
          <div className="text-layer-4 mb-3 font-semibold text-sm">
            <FormattedMessage defaultMessage="Recommended by:" />
            &nbsp;
            {config.score > 0 && (
              <>
                (WoT: <FormattedNumber value={config.score} maximumFractionDigits={1} />)
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {wot
              .sortEvents(config.recommendations)
              .slice(0, 8)
              .map(event => (
                <Profile
                  key={event.id}
                  pubkey={event.pubkey}
                  title={event.content}
                  options={{
                    showName: false,
                  }}
                  className="flex-shrink-0"
                />
              ))}
            {config.recommendations.length > 4 && (
              <span className="text-layer-4 self-center text-xs">+{config.recommendations.length - 4}</span>
            )}
          </div>
        </div>
      )}

      {showRecommendModal && (
        <Modal id="recommend-provider" onClose={() => setShowRecommendModal(false)}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                <FormattedMessage defaultMessage="Recommend Provider" />
              </h2>
              <button className="text-layer-4 hover:text-white" onClick={() => setShowRecommendModal(false)}>
                <Icon name="close" size={24} />
              </button>
            </div>

            <p className="text-layer-5 text-sm">
              <FormattedMessage
                defaultMessage="Write a recommendation for {providerName}. This will be published publicly on Nostr."
                values={{ providerName: config.name }}
              />
            </p>

            <div className="flex flex-col gap-2">
              <label htmlFor="recommend-content" className="text-sm font-medium text-layer-4">
                <FormattedMessage defaultMessage="Your recommendation:" />
              </label>
              <textarea
                id="recommend-content"
                value={recommendContent}
                onChange={e => setRecommendContent(e.target.value)}
                className="w-full p-3 bg-layer-1 border border-layer-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                maxLength={280}
                placeholder={formatMessage({ defaultMessage: "Share why you recommend this provider..." })}
              />
              <div className="text-xs text-layer-4 text-right">{recommendContent.length}/280</div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Layer2Button onClick={() => setShowRecommendModal(false)}>
                <FormattedMessage defaultMessage="Cancel" />
              </Layer2Button>
              <DefaultButton onClick={handleRecommend} disabled={isRecommending || !recommendContent.trim()}>
                {isRecommending ? (
                  <>
                    <Icon name="loading" size={16} />
                    <FormattedMessage defaultMessage="Publishing..." />
                  </>
                ) : (
                  <>
                    <Icon name="heart" size={16} />
                    <FormattedMessage defaultMessage="Recommend" />
                  </>
                )}
              </DefaultButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
