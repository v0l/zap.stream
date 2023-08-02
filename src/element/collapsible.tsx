import "./collapsible.css";
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { ExternalLink } from "element/external-link";

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
