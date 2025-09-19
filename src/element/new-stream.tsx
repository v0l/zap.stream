import { ReactNode, useState } from "react";
import { FormattedMessage } from "react-intl";

import { Icon } from "./icon";
import { useStreamProvider } from "@/hooks/stream-provider";
import { StreamEditorProps } from "./stream-editor";
import NostrProviderDialog from "@/element/provider/nostr";
import { DefaultButton } from "./buttons";
import Modal from "./modal";

export function NewStream({ ev, onFinish }: Omit<StreamEditorProps, "onFinish"> & { onFinish: () => void }) {
  const { provider: currentProvider } = useStreamProvider();

  return (
    <>
      <div className="flex flex-col gap-4">
        <NostrProviderDialog
          provider={currentProvider}
          onFinish={onFinish}
          ev={ev}
          showEndpoints={false}
          showEditor={true}
          showForwards={false}
          showBalanceHistory={false}
          showStreamKeys={false}
        />
      </div>
    </>
  );
}

interface NewStreamDialogProps {
  text?: ReactNode;
  btnClassName?: string;
}

export function NewStreamDialog({ text, btnClassName, ...props }: NewStreamDialogProps & StreamEditorProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DefaultButton className={btnClassName} onClick={() => setOpen(true)}>
        {text && text}
        {!text && (
          <>
            <span className="max-xl:hidden">
              <FormattedMessage defaultMessage="Stream" id="uYw2LD" />
            </span>
            <Icon name="signal" />
          </>
        )}
      </DefaultButton>
      {open && (
        <Modal id="new-stream" onClose={() => setOpen(false)}>
          <div className="new-stream">
            <NewStream {...props} onFinish={() => setOpen(false)} />
          </div>
        </Modal>
      )}
    </>
  );
}
