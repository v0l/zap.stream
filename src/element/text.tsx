import { NostrLink, NostrPrefix, ParsedFragment, transformText, tryParseNostrLink } from "@snort/system";
import { FunctionComponent, useMemo } from "react";

import { Emoji } from "./emoji";
import { Mention } from "./mention";
import { HyperText } from "./hypertext";
import { Event } from "./Event";

export type EventComponent = FunctionComponent<{ link: NostrLink }>;

interface TextProps {
  content: string;
  tags: Array<Array<string>>;
  eventComponent?: EventComponent;
}

export function Text({ content, tags, eventComponent }: TextProps) {
  const frags = useMemo(() => {
    return transformText(content, tags);
  }, [content, tags]);

  function renderFrag(f: ParsedFragment) {
    switch (f.type) {
      case "custom_emoji":
        return <Emoji name="" url={f.content} />;
      case "media":
      case "link": {
        if (f.content.startsWith("nostr:")) {
          const link = tryParseNostrLink(f.content);
          if (link) {
            if (
              link.type === NostrPrefix.Event ||
              link?.type === NostrPrefix.Address ||
              link?.type === NostrPrefix.Note
            ) {
              return eventComponent?.({ link }) ?? <Event link={link} />;
            } else {
              return <Mention pubkey={link.id} />;
            }
          }
        }
        return <HyperText link={f.content}>{f.content}</HyperText>;
      }
      case "mention":
        return <Mention pubkey={f.content} />;
      default:
        return <span className="text">{f.content}</span>;
    }
  }

  return frags.map(renderFrag);
}
