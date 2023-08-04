import type { ReactNode } from "react";
import { NostrLink } from "element/nostr-link";
import { MediaURL } from "element/collapsible";

const FileExtensionRegex = /\.([\w]+)$/i;

interface HyperTextProps {
  link: string;
  children: ReactNode;
}

export function HyperText({ link, children }: HyperTextProps) {
  try {
    const url = new URL(link);
    const extension =
      FileExtensionRegex.test(url.pathname.toLowerCase()) && RegExp.$1;

    if (extension) {
      switch (extension) {
        case "gif":
        case "jpg":
        case "jpeg":
        case "png":
        case "bmp":
        case "webp": {
          return (
            <MediaURL url={url}>
              <img
                src={url.toString()}
                alt={url.toString()}
                style={{ objectFit: "contain" }}
              />
            </MediaURL>
          );
        }
        case "wav":
        case "mp3":
        case "ogg": {
          return (
            <MediaURL url={url}>
              <audio key={url.toString()} src={url.toString()} controls />;
            </MediaURL>
          );
        }
        case "mp4":
        case "mov":
        case "mkv":
        case "avi":
        case "m4v":
        case "webm": {
          return (
            <MediaURL url={url}>
              <video key={url.toString()} src={url.toString()} controls />
            </MediaURL>
          );
        }
        default:
          return <a href={url.toString()}>{children || url.toString()}</a>;
      }
    } else if (url.protocol === "nostr:" || url.protocol === "web+nostr:") {
      return <NostrLink link={link} />;
    } else {
      <a href={link} target="_blank" rel="noreferrer">
        {children}
      </a>;
    }
  } catch (error) {
    console.error(error);
    // Ignore the error.
  }
  return (
    <a href={link} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}
