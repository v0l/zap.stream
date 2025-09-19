import { TaggedNostrEvent } from "@snort/system";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { DefaultButton } from "@/element/buttons";
import Modal from "@/element/modal";
import { getCurrentStreamProvider } from "@/hooks/stream-provider";
import NostrProviderDialog from "@/element/provider/nostr";
import { NostrStreamProvider } from "@/providers";

export function DashboardSettingsButton({ ev }: { ev?: TaggedNostrEvent }) {
  const [show, setShow] = useState(false);
  const provider = getCurrentStreamProvider(ev) as NostrStreamProvider;
  return (
    <>
      <DefaultButton onClick={() => setShow(true)}>
        <FormattedMessage defaultMessage="Settings" />
      </DefaultButton>
      {show && (
        <Modal id="dashboard-settings" onClose={() => setShow(false)}>
          <div className="flex flex-col gap-4">
            <NostrProviderDialog
              provider={provider}
              ev={ev}
              showEndpoints={true}
              showBalance={true}
              showEstimate={true}
              showForwards={true}
              showEditor={false}
              showBalanceHistory={false}
              showStreamKeys={true}
              showNwc={true}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
