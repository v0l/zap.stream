import NostrProviderDialog from "@/element/provider/nostr";
import { useStreamProvider } from "@/hooks/stream-provider";
import { NostrStreamProvider } from "@/providers";
import { unwrap } from "@snort/shared";
import { FormattedMessage } from "react-intl";

export function StreamSettingsTab() {
  const providers = useStreamProvider();
  return (
    <>
      <h1>
        <FormattedMessage defaultMessage="Stream" id="uYw2LD" />
      </h1>
      <div className="flex flex-col gap-4">
        <NostrProviderDialog
          provider={unwrap(providers.find(a => a.name === "zap.stream")) as NostrStreamProvider}
          showEndpoints={true}
          showEditor={false}
          showForwards={true}
          showBalanceHistory={true}
        />
      </div>
    </>
  );
}
