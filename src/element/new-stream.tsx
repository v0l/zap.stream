import "./new-stream.css";
import * as Dialog from "@radix-ui/react-dialog";

import { Icon } from "element/icon";
import { useStreamProvider } from "hooks/stream-provider";
import { StreamProvider, StreamProviders } from "providers";
import { useContext, useEffect, useState } from "react";
import { StreamEditor, StreamEditorProps } from "./stream-editor";
import { useNavigate } from "react-router-dom";
import { eventLink, findTag } from "utils";
import { NostrProviderDialog } from "./nostr-provider-dialog";
import { unwrap } from "@snort/shared";
import { FormattedMessage } from "react-intl";
import { SnortContext } from "@snort/system-react";

function NewStream({ ev, onFinish }: StreamEditorProps) {
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
                if (findTag(ex, "content-warning") && __XXX_HOST && __XXX === false) {
                  location.href = `${__XXX_HOST}/${eventLink(ex)}`;
                } else {
                  navigate(`/${eventLink(ex)}`, {
                    state: ex,
                  });
                  onFinish?.(ex);
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
        return <NostrProviderDialog provider={currentProvider} onFinish={onFinish} ev={ev} />;
      }
      case StreamProviders.Owncast: {
        return;
      }
    }
  }

  return (
    <>
      <p>
        <FormattedMessage defaultMessage="Stream Providers" />
      </p>
      <div className="flex g12">
        {providers.map(v => (
          <span className={`pill${v === currentProvider ? " active" : ""}`} onClick={() => setCurrentProvider(v)}>
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

export function NewStreamDialog(props: NewStreamDialogProps & StreamEditorProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={props.btnClassName}>
          {props.text && props.text}
          {!props.text && (
            <>
              <span className="hide-on-mobile">
                <FormattedMessage defaultMessage="Stream" />
              </span>
              <Icon name="signal" />
            </>
          )}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="content-inner">
            <div className="new-stream">
              <NewStream {...props} onFinish={() => setOpen(false)} />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
