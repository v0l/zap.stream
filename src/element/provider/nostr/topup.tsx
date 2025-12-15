import { DefaultButton } from "@/element/buttons";
import Modal from "@/element/modal";
import { SendZaps } from "@/element/send-zap";
import type { NostrStreamProvider } from "@/providers";
import { useState } from "react";
import { FormattedMessage } from "react-intl";

export default function AccountTopup({ provider, onFinish }: { provider: NostrStreamProvider; onFinish: () => void }) {
  const [topup, setTopup] = useState(false);
  return (
    <>
      <DefaultButton onClick={() => setTopup(true)}>
        <FormattedMessage defaultMessage="Topup" />
      </DefaultButton>
      {topup && (
        <Modal id="topup" onClose={() => setTopup(false)}>
          <SendZaps
            lnurl={{
              name: provider.name,
              canZap: false,
              maxCommentLength: 0,
              getInvoice: async amount => {
                const pr = await provider.topup(amount);
                return { pr };
              },
            }}
            onFinish={onFinish}
          />
        </Modal>
      )}
    </>
  );
}
