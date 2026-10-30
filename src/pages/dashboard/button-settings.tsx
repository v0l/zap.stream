import type { TaggedNostrEvent } from "@snort/system"
import { useState } from "react"
import { FormattedMessage } from "react-intl"
import { DefaultButton } from "@/element/buttons"
import Modal from "@/element/modal"
import NostrProviderDialog from "@/element/provider/nostr"
import type { NostrStreamProvider } from "@/providers"

export function DashboardSettingsButton({ ev, provider }: { ev?: TaggedNostrEvent; provider: NostrStreamProvider }) {
  const [show, setShow] = useState(false)
  return (
    <>
      <DefaultButton onClick={() => setShow(true)}>
        <FormattedMessage defaultMessage="Settings" />
      </DefaultButton>
      {show && (
        <Modal
          id="dashboard-settings"
          title={<FormattedMessage defaultMessage="Stream settings" />}
          onClose={() => setShow(false)}
        >
          <NostrProviderDialog
            provider={provider}
            ev={ev}
            showEndpoints={true}
            showForwards={false}
            showEditor={false}
            showBalanceHistory={false}
            showStreamKeys={true}
            showNwc={true}
          />
        </Modal>
      )}
    </>
  )
}
