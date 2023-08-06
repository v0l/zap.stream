import "./new-stream.css";
import * as Dialog from "@radix-ui/react-dialog";

import { Icon } from "element/icon";
import { useStreamProvider } from "hooks/stream-provider";
import { StreamProvider, StreamProviders } from "providers";
import { useEffect, useState } from "react";
import { StreamEditor, StreamEditorProps } from "./stream-editor";
import { useNavigate } from "react-router-dom";
import { eventLink, findTag } from "utils";
import { NostrProviderDialog } from "./nostr-provider-dialog";

function NewStream({ ev, onFinish }: StreamEditorProps) {
  const providers = useStreamProvider();
  const [currentProvider, setCurrentProvider] = useState<StreamProvider>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentProvider) {
      setCurrentProvider(
        ev !== undefined
          ? providers.find((a) => a.name.toLowerCase() === "manual")!
          : providers.at(0)
      );
    }
  }, [providers, currentProvider]);

  function providerDialog() {
    if (!currentProvider) return;

    switch (currentProvider.type) {
      case StreamProviders.Manual: {
        return (
          <StreamEditor
            onFinish={(ex) => {
              currentProvider.updateStreamInfo(ex);
              if (!ev) {
                if (findTag(ex, "content-warning") && __XXX_HOST) {
                  location.href = `${__XXX_HOST}/${eventLink(ex)}`;
                } else {
                  navigate(`/${eventLink(ex)}`, {
                    state: ev,
                  });
                }
              } else {
                onFinish?.(ev);
              }
            }}
            ev={ev}
          />
        );
      }
      case StreamProviders.NostrType: {
        return (
          <NostrProviderDialog
            provider={currentProvider}
            onFinish={onFinish}
            ev={ev}
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
      <p>Stream Providers</p>
      <div className="flex g12">
        {providers.map((v) => (
          <span
            className={`pill${v === currentProvider ? " active" : ""}`}
            onClick={() => setCurrentProvider(v)}
          >
            {v.name}
          </span>
        ))}
      </div>
      {providerDialog()}
    </>
  );
}

interface NewStreamDialogProps {
  text?: string;
  btnClassName?: string;
}

export function NewStreamDialog(
  props: NewStreamDialogProps & StreamEditorProps
) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={props.btnClassName}>
          {props.text && props.text}
          {!props.text && (
            <>
              <span className="hide-on-mobile">Stream</span>
              <Icon name="signal" />
            </>
          )}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="new-stream">
            <NewStream {...props} onFinish={() => setOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
