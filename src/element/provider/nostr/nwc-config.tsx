import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { NostrStreamProvider } from "@/providers";
import { DefaultButton } from "@/element/buttons";
import Spinner from "@/element/spinner";

interface NwcConfigProps {
  provider: NostrStreamProvider;
  hasNwc?: boolean;
  onConfigured?: () => void;
}

export default function NwcConfig({ provider, hasNwc, onConfigured }: NwcConfigProps) {
  const [nwcUri, setNwcUri] = useState("");
  const [status, setStatus] = useState<"idle" | "configuring" | "success" | "error" | "removing">("idle");
  const [error, setError] = useState<string>();

  async function configureNwc() {
    if (!nwcUri.trim() || !provider.configureNwc) return;

    setStatus("configuring");
    setError(undefined);

    try {
      await provider.configureNwc(nwcUri.trim());
      setStatus("success");
      setNwcUri("");
      onConfigured?.();
    } catch (err) {
      console.error("Failed to configure NWC:", err);
      setError(err instanceof Error ? err.message : "Failed to configure NWC");
      setStatus("error");
    }
  }

  async function removeNwc() {
    if (!provider.removeNwc) return;

    setStatus("removing");
    setError(undefined);

    try {
      await provider.removeNwc();
      setStatus("success");
      onConfigured?.();
    } catch (err) {
      console.error("Failed to remove NWC:", err);
      setError(err instanceof Error ? err.message : "Failed to remove NWC");
      setStatus("error");
    }
  }

  const isValidNwcUri = nwcUri.trim().startsWith("nostr+walletconnect://");

  function renderConfiguredState() {
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3">
          <FormattedMessage
            defaultMessage="✅ NWC is configured and ready for automated topups"
            id="nwc-configured"
          />
        </div>

        <DefaultButton
          onClick={removeNwc}
          disabled={status === "removing"}
          className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50"
        >
          {status === "removing" && (
            <>
              <Spinner />
              <FormattedMessage
                defaultMessage="Removing NWC..."
                id="nwc-removing-button"
              />
            </>
          )}
          {status !== "removing" && (
            <FormattedMessage
              defaultMessage="Remove NWC"
              id="nwc-remove-button"
            />
          )}
        </DefaultButton>
      </div>
    );
  }

  function renderConfigurationState() {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-400">
          <FormattedMessage
            defaultMessage="Configure Nostr Wallet Connect for automated topups."
            id="nwc-description"
          />
        </p>

        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="nostr+walletconnect://..."
            value={nwcUri}
            onChange={e => setNwcUri(e.target.value)}
            className="bg-layer-2 rounded-xl px-3 py-2 w-full"
            disabled={status === "configuring"}
          />

          {!isValidNwcUri && nwcUri.trim() && (
            <small className="text-red-400">
              <FormattedMessage
                defaultMessage="NWC URI must start with 'nostr+walletconnect://'"
                id="nwc-invalid-format"
              />
            </small>
          )}
        </div>

        <DefaultButton
          onClick={configureNwc}
          disabled={!isValidNwcUri || status === "configuring"}
        >
          {status === "configuring" && (
            <>
              <Spinner />
              <FormattedMessage
                defaultMessage="Configuring..."
                id="nwc-configure-button"
              />
            </>
          )}
          {status !== "configuring" && (
            <FormattedMessage
              defaultMessage="Enable NWC"
              id="nwc-configure-button"
            />
          )}
        </DefaultButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3>
        <FormattedMessage defaultMessage="Nostr Wallet Connect (NWC)" id="nwc-title" />
      </h3>

      {hasNwc ? renderConfiguredState() : renderConfigurationState()}

      {status === "success" && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3">
          {hasNwc ? (
            <FormattedMessage
              defaultMessage="NWC removed successfully!"
              id="nwc-removed-success"
            />
          ) : (
            <FormattedMessage
              defaultMessage="NWC configured successfully!"
              id="nwc-configured-success"
            />
          )}
        </div>
      )}

      {status === "error" && error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
          <FormattedMessage
            defaultMessage="Error: {error}"
            id="nwc-error"
            values={{ error }}
          />
        </div>
      )}

      <div className="text-xs text-gray-500">
        <FormattedMessage
          defaultMessage="NWC requires 'pay_invoice' permissions. The server will validate your connection before saving."
          id="nwc-permissions-note"
        />
      </div>
    </div>
  );
}