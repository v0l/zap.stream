import { Menu, MenuItem } from "@szhsin/react-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "./icon";
import { useState } from "react";
import { Textarea } from "./textarea";
import { NostrEvent, NostrPrefix, encodeTLV } from "@snort/system";
import { findTag } from "utils";
import AsyncButton from "./async-button";
import { useLogin } from "hooks/login";
import { System } from "index";

type ShareOn = "nostr" | "twitter";

export function ShareMenu({ ev }: { ev: NostrEvent }) {
  const [share, setShare] = useState<ShareOn>();
  const [message, setMessage] = useState("");
  const login = useLogin();

  const naddr = encodeTLV(
    NostrPrefix.Address,
    findTag(ev, "d")!,
    undefined,
    ev.kind,
    ev.pubkey
  );
  const link = `https://zap.stream/${naddr}`;

  async function sendMessage() {
    const pub = login?.publisher();
    if (pub) {
      const ev = await pub.note(message);
      console.debug(ev);
      System.BroadcastEvent(ev);
      setShare(undefined);
    }
  }

  return (
    <>
      <Menu
        align="end"
        gap={5}
        menuClassName="ctx-menu"
        menuButton={
          <button type="button" className="btn btn-secondary">
            Share
          </button>
        }
      >
        <MenuItem
          onClick={() => {
            setMessage(
              `Come check out my stream on zap.stream!\n\n${link}\n\nnostr:${naddr}`
            );
            setShare("nostr");
          }}
        >
          <Icon name="nostrich" size={24} />
          Broadcast on Nostr
        </MenuItem>
      </Menu>
      <Dialog.Root
        open={Boolean(share)}
        onOpenChange={() => setShare(undefined)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <h2>Share</h2>
            <div className="paper">
              <Textarea
                emojis={[]}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={() => {
                  //noop
                }}
                rows={15}
              />
            </div>
            <AsyncButton className="btn btn-primary" onClick={sendMessage}>
              Send
            </AsyncButton>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
