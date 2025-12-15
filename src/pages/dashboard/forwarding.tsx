import { DefaultButton } from "@/element/buttons";
import Modal from "@/element/modal";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import type { NostrStreamProvider } from "@/providers";
import NostrProviderDialog from "@/element/provider/nostr";

export default function ForwardingModal({ provider }: { provider: NostrStreamProvider }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <DefaultButton onClick={() => setShow(true)}>
        <FormattedMessage defaultMessage="Stream Forwarding" />
      </DefaultButton>
      {show && (
        <Modal id="raid-menu" onClose={() => setShow(false)}>
          <NostrProviderDialog
            provider={provider}
            showBalanceHistory={false}
            showEditor={false}
            showEndpoints={false}
            showForwards={true}
            showStreamKeys={false}
          />
        </Modal>
      )}
    </>
  );
}
