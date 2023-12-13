import "./collapsible.css";
import type { ReactNode } from "react";
import { useState } from "react";

import { FormattedMessage } from "react-intl";
import * as Dialog from "@radix-ui/react-dialog";
import * as Collapsible from "@radix-ui/react-collapsible";

import type { NostrLink } from "@snort/system";

import { Mention } from "./mention";
import { EventIcon, NostrEvent } from "./Event";
import { ExternalLink } from "./external-link";
import { useEvent } from "@/hooks/event";
import AsyncButton from "./async-button";

interface MediaURLProps {
  url: URL;
  children: ReactNode;
}

export function MediaURL({ url, children }: MediaURLProps) {
  const preview = <span className="url-preview">{url.toString()}</span>;
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{preview}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="collapsible-media">
            <ExternalLink href={url.toString()}>{url.toString()}</ExternalLink>
            {children}
          </div>
          <Dialog.Close asChild>
            <AsyncButton className="btn delete-button" aria-label="Close">
              <FormattedMessage defaultMessage="Close" id="rbrahO" />
            </AsyncButton>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function CollapsibleEvent({ link }: { link: NostrLink }) {
  const event = useEvent(link);
  const [open, setOpen] = useState(false);
  const author = event?.pubkey || link.author;

  return (
    <Collapsible.Root className="collapsible" open={open} onOpenChange={setOpen}>
      <div className="collapsed-event">
        <div className="collapsed-event-header">
          {event && <EventIcon kind={event.kind} />}
          {author && <Mention pubkey={author} />}
        </div>
        <Collapsible.Trigger asChild>
          <AsyncButton className={`${open ? "btn btn-small delete-button" : "btn btn-small"}`}>
            {open ? (
              <FormattedMessage defaultMessage="Hide" id="VA/Z1S" />
            ) : (
              <FormattedMessage defaultMessage="Show" id="K7AkdL" />
            )}
          </AsyncButton>
        </Collapsible.Trigger>
      </div>
      <Collapsible.Content>{open && event && <NostrEvent ev={event} />}</Collapsible.Content>
    </Collapsible.Root>
  );
}
