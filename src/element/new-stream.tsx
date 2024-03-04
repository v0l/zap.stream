import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { unwrap } from "@snort/shared";
import { FormattedMessage } from "react-intl";
import { SnortContext } from "@snort/system-react";

import { Icon } from "./icon";
import { useStreamProvider } from "@/hooks/stream-provider";
import { NostrStreamProvider, StreamProvider, StreamProviders } from "@/providers";
import { StreamEditor, StreamEditorProps } from "./stream-editor";
import { eventLink } from "@/utils";
import { NostrProviderDialog } from "./nostr-provider-dialog";
import { DefaultButton } from "./buttons";
import Pill from "./pill";
import Modal from "./modal";

function NewStream({ ev, onFinish }: Omit<StreamEditorProps, "onFinish"> & { onFinish: () => void }) {
  const system = useContext(SnortContext);
  const providers = useStreamProvider();
  const [currentProvider, setCurrentProvider] = useState<StreamProvider>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentProvider) {
      setCurrentProvider(
        ev !== undefined ? unwrap(providers.find(a => a.name.toLowerCase() === "manual")) : providers.at(0)
      );
    }
  }, [providers, currentProvider]);

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
          <>
            <DefaultButton
              onClick={() => {
                navigate("/settings/stream");
                onFinish?.();
              }}>
              <FormattedMessage defaultMessage="Get Stream Key" id="Vn2WiP" />
            </DefaultButton>
            <NostrProviderDialog
              provider={currentProvider as NostrStreamProvider}
              onFinish={onFinish}
              ev={ev}
              showEndpoints={false}
              showEditor={true}
              showForwards={false}
            />
          </>
        );
      }
      case StreamProviders.Owncast: {
        return;
      }
    }
  }

  return (
    <>
      <p>
        <FormattedMessage defaultMessage="Stream Providers" id="6Z2pvJ" />
      </p>
      <div className="flex gap-2">
        {providers.map(v => (
          <Pill className={`${v === currentProvider ? " text-bold" : ""}`} onClick={() => setCurrentProvider(v)}>
            {v.name}
          </Pill>
        ))}
      </div>
      <div className="flex flex-col gap-4">{providerDialog()}</div>
    </>
  );
}

interface NewStreamDialogProps {
  text?: string;
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
