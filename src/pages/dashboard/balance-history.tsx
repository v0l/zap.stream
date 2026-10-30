import { DefaultButton } from "@/element/buttons"
import Modal from "@/element/modal"
import { useState } from "react"
import { FormattedMessage } from "react-intl"
import type { NostrStreamProvider } from "@/providers"
import NostrProviderDialog from "@/element/provider/nostr"

export default function BalanceHistoryModal({ provider }: { provider: NostrStreamProvider }) {
  const [show, setShow] = useState(false)
  return (
    <>
      <DefaultButton onClick={() => setShow(true)}>
        <FormattedMessage defaultMessage="Balance" />
      </DefaultButton>
      {show && (
        <Modal id="balance" title={<FormattedMessage defaultMessage="Balance" />} onClose={() => setShow(false)}>
          <NostrProviderDialog
            provider={provider}
            showBalanceHistory={true}
            showBalance={true}
            showEstimate={true}
            showEditor={false}
            showEndpoints={false}
            showForwards={false}
            showStreamKeys={false}
          />
        </Modal>
      )}
    </>
  )
}
