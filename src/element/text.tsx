import { NostrLink, NostrPrefix, ParsedFragment, transformText, tryParseNostrLink } from "@snort/system";
import { FunctionComponent, useMemo } from "react";
import { Link } from "react-router-dom";

import { Emoji } from "./emoji";
import { Mention } from "./mention";
import { HyperText } from "./hypertext";
import { EventEmbed } from "./event-embed";
import { SendZapsDialog } from "./send-zap";

export type EventComponent = FunctionComponent<{ link: NostrLink }>;

interface TextProps {
  content: string;
  tags: Array<Array<string>>;
  eventComponent?: EventComponent;
  className?: string;
}

export function Text({ content, tags, eventComponent, className }: TextProps) {
  const frags = useMemo(() => {
    return transformText(content, tags);
  }, [content, tags]);

  function renderFrag(f: ParsedFragment) {
    switch (f.type) {
      case "custom_emoji":
        return <Emoji name={f.content} url={f.content} />;
      case "media":
      case "link": {
        if (f.content.startsWith("nostr:")) {
          const link = tryParseNostrLink(f.content);
          if (link) {
            if (
              link.type === NostrPrefix.Event ||
              link.type === NostrPrefix.Address ||
              link.type === NostrPrefix.Note
            ) {
              return eventComponent?.({ link }) ?? <EventEmbed link={link} />;
            } else {
              return <Mention pubkey={link.id} />;
            }
          }
        }
        return (
          <HyperText link={f.content}>{f.content}</HyperText>
        );
      }
      case "mention":
        return <Mention pubkey={f.content} />;
      case "hashtag":
        return <Link to={`/t/${f.content}`}>#{f.content}</Link>;
      default: {
        if (f.content.startsWith("lnurlp:")) {
          // LUD-17: https://github.com/lnurl/luds/blob/luds/17.md
          const url = new URL(f.content);
          url.protocol = "https:";
          return <SendZapsDialog pubkey={undefined} lnurl={url.toString()} button={<Link to={""}>{f.content}</Link>} />;
        }
        return <span>{f.content}</span>;
      }
    }
  }

  return <span className={className}>{frags.map(renderFrag)}</span>;
}
