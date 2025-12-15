import { DefaultButton } from "@/element/buttons";
import Modal from "@/element/modal";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import type { NostrStreamProvider } from "@/providers";
import NostrProviderDialog from "@/element/provider/nostr";

export default function BalanceHistoryModal({ provider }: { provider: NostrStreamProvider }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <DefaultButton onClick={() => setShow(true)}>
        <FormattedMessage defaultMessage="Balance" />
      </DefaultButton>
      {show && (
        <Modal id="raid-menu" onClose={() => setShow(false)} largeModal={true}>
          <NostrProviderDialog
            provider={provider}
            showBalanceHistory={true}
            showBalance={true}
            showEditor={false}
            showEndpoints={false}
            showForwards={false}
            showStreamKeys={false}
          />
        </Modal>
      )}
    </>
  );
}
