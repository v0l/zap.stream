import Modal from "@/element/modal";
import { StreamEditor } from "@/element/stream-editor";
import { NostrLink } from "@snort/system";
import { SnortContext } from "@snort/system-react";
import { useContext, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";

export default function ManualStream() {
  const [open, setOpen] = useState(false);
  const system = useContext(SnortContext);
  const navigate = useNavigate();

  return (
    <>
      <div className="text-primary cursor-pointer select-none" onClick={() => setOpen(true)}>
        <FormattedMessage defaultMessage="I have my own stream host" />
      </div>
      {open && (
        <Modal id="new-stream" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3">
            <StreamEditor
              onFinish={ex => {
                system.BroadcastEvent(ex);
                if (!ex) {
                  navigate(`/${NostrLink.fromEvent(ex).encode()}`, {
                    state: ex,
                  });
                }
              }}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
