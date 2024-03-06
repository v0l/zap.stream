import { ReactNode, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { SnortContext } from "@snort/system-react";

import { Icon } from "./icon";
import { getCurrentStreamProvider, useStreamProvider } from "@/hooks/stream-provider";
import { NostrStreamProvider, StreamProvider, StreamProviders } from "@/providers";
import { StreamEditor, StreamEditorProps } from "./stream-editor";
import { eventLink } from "@/utils";
import NostrProviderDialog from "@/element/provider/nostr";
import { DefaultButton } from "./buttons";
import Pill from "./pill";
import Modal from "./modal";

export function NewStream({ ev, onFinish }: Omit<StreamEditorProps, "onFinish"> & { onFinish: () => void }) {
  const system = useContext(SnortContext);
  const providers = useStreamProvider();
  const [currentProvider, setCurrentProvider] = useState<StreamProvider>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentProvider) {
      setCurrentProvider(getCurrentStreamProvider(ev));
    }
  }, [ev, providers, currentProvider]);

  function providerDialog() {
    if (!currentProvider) return;

    switch (currentProvider.type) {
      case StreamProviders.Manual: {
        return (
          <StreamEditor
            onFinish={ex => {
              currentProvider.updateStreamInfo(system, ex);
              if (!ev) {
                navigate(`/${eventLink(ex)}`, {
                  state: ex,
                });
                onFinish?.();
              } else {
                onFinish?.();
              }
            }}
            ev={ev}
          />
        );
      }
      case StreamProviders.NostrType: {
        return (
          <NostrProviderDialog
            provider={currentProvider as NostrStreamProvider}
            onFinish={onFinish}
            ev={ev}
            showEndpoints={false}
            showEditor={true}
            showForwards={false}
          />
        );
      }
      case StreamProviders.Owncast: {
        return;
      }
    }
  }

  return (
    <>
      {!ev && <>
        <FormattedMessage defaultMessage="Stream Providers" id="6Z2pvJ" />
        <div className="flex gap-2">
          {providers.map(v => (
            <Pill className={`${v === currentProvider ? " text-bold" : ""}`} onClick={() => setCurrentProvider(v)}>
              {v.name}
            </Pill>
          ))}
        </div>
      </>}
      <div className="flex flex-col gap-4">{providerDialog()}</div>
    </>
  );
}

interface NewStreamDialogProps {
  text?: ReactNode;
  btnClassName?: string;
}

export function NewStreamDialog(props: NewStreamDialogProps & StreamEditorProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DefaultButton className={props.btnClassName} onClick={() => setOpen(true)}>
        {props.text && props.text}
        {!props.text && (
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
