import "./collapsible.css";
import type { ReactNode } from "react";
import { useState } from "react";

import * as Dialog from "@radix-ui/react-dialog";
import * as Collapsible from "@radix-ui/react-collapsible";

import type { NostrLink } from "@snort/system";

import { Mention } from "element/mention";
import { NostrEvent, EventIcon } from "element/Event";
import { ExternalLink } from "element/external-link";
import { useEvent } from "hooks/event";

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
            <button className="btn delete-button" aria-label="Close">
              Close
            </button>
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
    <Collapsible.Root
      className="collapsible"
      open={open}
      onOpenChange={setOpen}
    >
      <div className="collapsed-event">
        <div className="collapsed-event-header">
          {event && <EventIcon kind={event.kind} />}
          {author && <Mention pubkey={author} />}
        </div>
        <Collapsible.Trigger asChild>
          <button
            className={`${
              open ? "btn btn-small delete-button" : "btn btn-small"
            }`}
          >
            {open ? "Hide" : "Show"}
          </button>
        </Collapsible.Trigger>
      </div>
      <Collapsible.Content>
        {open && event && (
          <div className="expanded-event">
            {" "}
            <NostrEvent ev={event} />
          </div>
        )}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
