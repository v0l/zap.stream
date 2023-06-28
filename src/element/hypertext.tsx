import { NostrLink } from "./nostr-link";

interface HyperTextProps {
  link: string;
}

export function HyperText({ link }: HyperTextProps) {
  try {
    const url = new URL(link);
    if (url.protocol === "nostr:" || url.protocol === "web+nostr:") {
      return <NostrLink link={link} />;
    } else {
      <a href={link} target="_blank" rel="noreferrer">
        {link}
      </a>;
    }
  } catch {
    // Ignore the error.
  }
  return (
    <a href={link} target="_blank" rel="noreferrer">
      {link}
    </a>
  );
}
