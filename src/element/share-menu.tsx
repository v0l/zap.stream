import { Menu, MenuItem } from "@szhsin/react-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { unwrap } from "@snort/shared";
import { NostrEvent, NostrPrefix, encodeTLV } from "@snort/system";
import { FormattedMessage } from "react-intl";
import { useContext, useState } from "react";
import { SnortContext } from "@snort/system-react";

import { Icon } from "./icon";
import { Textarea } from "./textarea";
import { findTag } from "@/utils";
import AsyncButton from "./async-button";
import { useLogin } from "@/hooks/login";

type ShareOn = "nostr" | "twitter";

export function ShareMenu({ ev }: { ev: NostrEvent }) {
  const system = useContext(SnortContext);
  const [share, setShare] = useState<ShareOn>();
  const [message, setMessage] = useState("");
  const login = useLogin();

  const naddr = encodeTLV(NostrPrefix.Address, unwrap(findTag(ev, "d")), undefined, ev.kind, ev.pubkey);
  const link = `https://zap.stream/${naddr}`;

  async function sendMessage() {
    const pub = login?.publisher();
    if (pub) {
      const ev = await pub.note(message);
      console.debug(ev);
      await system.BroadcastEvent(ev);
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
          <AsyncButton className="btn btn-secondary">
            <FormattedMessage defaultMessage="Share" id="OKhRC6" />
          </AsyncButton>
        }>
        <MenuItem
          onClick={() => {
            setMessage(`Come check out my stream on zap.stream!\n\n${link}\n\nnostr:${naddr}`);
            setShare("nostr");
          }}>
          <Icon name="nostrich" size={24} />
          <FormattedMessage defaultMessage="Broadcast on Nostr" id="wCIL7o" />
        </MenuItem>
      </Menu>
      <Dialog.Root open={Boolean(share)} onOpenChange={() => setShare(undefined)}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <div className="content-inner">
              <h2>
                <FormattedMessage defaultMessage="Share" id="OKhRC6" />
              </h2>
              <div className="paper">
                <Textarea
                  emojis={[]}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={() => {
                    //noop
                  }}
                  rows={15}
                />
              </div>
              <AsyncButton className="btn btn-primary" onClick={sendMessage}>
                <FormattedMessage defaultMessage="Send" id="9WRlF4" />
              </AsyncButton>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
