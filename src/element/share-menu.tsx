import { Menu, MenuItem } from "@szhsin/react-menu";
import { LinkScope, Nip10, type NostrEvent, NostrLink } from "@snort/system";
import { FormattedMessage, useIntl } from "react-intl";
import { useContext, useState } from "react";
import { SnortContext } from "@snort/system-react";

import { Icon } from "./icon";
import { Textarea } from "./chat/textarea";
import { getHost } from "@/utils";
import { useLogin } from "@/hooks/login";
import { DefaultButton } from "./buttons";
import Modal from "./modal";
import { NostrPrefix } from "@snort/shared";

type ShareOn = "nostr" | "twitter";

export function ShareMenu({ ev }: { ev: NostrEvent }) {
  const system = useContext(SnortContext);
  const [share, setShare] = useState<ShareOn>();
  const login = useLogin();
  const { formatMessage } = useIntl();
  const host = getHost(ev);

  const defaultMyMsg = formatMessage(
    {
      defaultMessage: "Come check out my stream on zap.stream!\n\n{link}\n\n",
      id: "HsgeUk",
    },
    {
      link: `https://${window.location.host}/${NostrLink.fromEvent(ev).encode()}`,
    },
  );
  const defaultHostMsg = formatMessage(
    {
      defaultMessage: "Come check out {name} stream on zap.stream!\n\n{link}",
      id: "PUymyQ",
    },
    {
      name: `nostr:${new NostrLink(NostrPrefix.PublicKey, host ?? ev.pubkey).encode()}`,
      link: `https://${window.location.host}/${NostrLink.fromEvent(ev).encode()}`,
    },
  );
  const [message, setMessage] = useState(login?.pubkey === host ? defaultMyMsg : defaultHostMsg);

  async function sendMessage() {
    const pub = login?.publisher();
    if (pub) {
      const evn = await pub.note(message, eb => {
        const link = NostrLink.fromEvent(ev);
        return eb.tag(Nip10.linkToTag(link, LinkScope.Mention));
      });
      console.debug(evn);
      await system.BroadcastEvent(evn);
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
          <DefaultButton>
            <Icon name="share" />
            <FormattedMessage defaultMessage="Share" />
          </DefaultButton>
        }>
        <MenuItem
          onClick={() => {
            setShare("nostr");
          }}>
          <Icon name="nostrich" size={24} />
          <FormattedMessage defaultMessage="Broadcast on Nostr" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&via=zap_stream`,
              "_blank",
            );
          }}>
          <Icon name="twitter" size={24} />
          <FormattedMessage defaultMessage="Share on X" />
        </MenuItem>
      </Menu>
      {share && (
        <Modal id="share" onClose={() => setShare(undefined)}>
          <div className="flex flex-col gap-4">
            <h2>
              <FormattedMessage defaultMessage="Share" />
            </h2>
            <Textarea
              emojis={[]}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={() => {
                //noop
              }}
              rows={15}
            />
            <DefaultButton onClick={sendMessage}>
              <FormattedMessage defaultMessage="Send" id="9WRlF4" />
            </DefaultButton>
          </div>
        </Modal>
      )}
    </>
  );
}
