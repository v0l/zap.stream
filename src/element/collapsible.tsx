import "./collapsible.css";
import type { ReactNode } from "react";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import type { NostrLink } from "@snort/system";
import { Mention } from "./mention";
import { EventIcon, NostrEvent } from "./Event";
import { ExternalLink } from "./external-link";
import { useEventFeed } from "@snort/system-react";
import Modal from "./modal";
import { DefaultButton } from "./buttons";

interface MediaURLProps {
  url: URL;
  children: ReactNode;
}

export function MediaURL({ url, children }: MediaURLProps) {
  const [open, setOpen] = useState(false);
  return (<>
    <span onClick={() => setOpen(true)}>{url.toString()}</span>
    {open && <Modal id="media-preview" onClose={() => setOpen(false)}>
      <ExternalLink href={url.toString()}>{url.toString()}</ExternalLink>
      {children}
    </Modal>}
  </>
  );
}

export function CollapsibleEvent({ link }: { link: NostrLink }) {
  const event = useEventFeed(link);
  const [open, setOpen] = useState(false);
  const author = event?.pubkey || link.author;

  return (
    <>
      <div className="flex justify-between">
        <div className="flex gap-2">
          <EventIcon kind={event?.kind} />
          <FormattedMessage defaultMessage="Note by {name}" id="ALdW69" values={{
            name: <Mention pubkey={author ?? ""} />
          }} />
        </div>
        <DefaultButton onClick={() => setOpen(s => !s)}>
          {open ? <FormattedMessage defaultMessage="Hide" id="VA/Z1S" /> : <FormattedMessage defaultMessage="Show" id="K7AkdL" />}
        </DefaultButton>
      </div>
      {open && event && <NostrEvent ev={event} />}
    </>
  );
}
