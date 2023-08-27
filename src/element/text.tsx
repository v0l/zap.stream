import { useMemo, type ReactNode, type FunctionComponent } from "react";

import { type NostrLink, parseNostrLink, validateNostrLink } from "@snort/system";

import { Event } from "element/Event";
import { Mention } from "element/mention";
import { Emoji } from "element/emoji";
import { HyperText } from "element/hypertext";
import { splitByUrl } from "utils";
import type { Tags } from "types";

export type Fragment = string | ReactNode;

const NostrPrefixRegex = /^nostr:/;
const EmojiRegex = /:([\w-]+):/g;

function extractLinks(fragments: Fragment[]) {
  return fragments
    .map(f => {
      if (typeof f === "string") {
        return splitByUrl(f).map(a => {
          const validateLink = () => {
            const normalizedStr = a.toLowerCase();

            if (normalizedStr.startsWith("web+nostr:") || normalizedStr.startsWith("nostr:")) {
              return validateNostrLink(normalizedStr);
            }

            return normalizedStr.startsWith("http:") || normalizedStr.startsWith("https:");
          };

          if (validateLink()) {
            return <HyperText link={a}>{a}</HyperText>;
          }
          return a;
        });
      }
      return f;
    })
    .flat();
}

function extractEmoji(fragments: Fragment[], tags: string[][]) {
  return fragments
    .map(f => {
      if (typeof f === "string") {
        return f.split(EmojiRegex).map(i => {
          const t = tags.find(a => a[0] === "emoji" && a[1] === i);
          if (t) {
            return <Emoji name={t[1]} url={t[2]} />;
          } else {
            return i;
          }
        });
      }
      return f;
    })
    .flat();
}

function extractNprofiles(fragments: Fragment[]) {
  return fragments
    .map(f => {
      if (typeof f === "string") {
        return f.split(/(nostr:nprofile1[a-z0-9]+)/g).map(i => {
          if (i.startsWith("nostr:nprofile1")) {
            try {
              const link = parseNostrLink(i.replace(NostrPrefixRegex, ""));
              return <Mention key={link.id} pubkey={link.id} />;
            } catch (error) {
              return i;
            }
          } else {
            return i;
          }
        });
      }
      return f;
    })
    .flat();
}

function extractNpubs(fragments: Fragment[]) {
  return fragments
    .map(f => {
      if (typeof f === "string") {
        return f.split(/(nostr:npub1[a-z0-9]+)/g).map(i => {
          if (i.startsWith("nostr:npub1")) {
            try {
              const link = parseNostrLink(i.replace(NostrPrefixRegex, ""));
              return <Mention key={link.id} pubkey={link.id} />;
            } catch (error) {
              return i;
            }
          } else {
            return i;
          }
        });
      }
      return f;
    })
    .flat();
}

function extractNevents(fragments: Fragment[], Event: NostrComponent) {
  return fragments
    .map(f => {
      if (typeof f === "string") {
        return f.split(/(nostr:nevent1[a-z0-9]+)/g).map(i => {
          if (i.startsWith("nostr:nevent1")) {
            try {
              const link = parseNostrLink(i.replace(NostrPrefixRegex, ""));
              return <Event link={link} />;
            } catch (error) {
              return i;
            }
          } else {
            return i;
          }
        });
      }
      return f;
    })
    .flat();
}

function extractNaddrs(fragments: Fragment[], Address: NostrComponent) {
  return fragments
    .map(f => {
      if (typeof f === "string") {
        return f.split(/(nostr:naddr1[a-z0-9]+)/g).map(i => {
          if (i.startsWith("nostr:naddr1")) {
            try {
              const link = parseNostrLink(i.replace(NostrPrefixRegex, ""));
              return <Address key={i} link={link} />;
            } catch (error) {
              console.error(error);
              return i;
            }
          } else {
            return i;
          }
        });
      }
      return f;
    })
    .flat();
}

function extractNoteIds(fragments: Fragment[], Event: NostrComponent) {
  return fragments
    .map(f => {
      if (typeof f === "string") {
        return f.split(/(nostr:note1[a-z0-9]+)/g).map(i => {
          if (i.startsWith("nostr:note1")) {
            try {
              const link = parseNostrLink(i.replace(NostrPrefixRegex, ""));
              return <Event link={link} />;
            } catch (error) {
              return i;
            }
          } else {
            return i;
          }
        });
      }
      return f;
    })
    .flat();
}

export type NostrComponent = FunctionComponent<{ link: NostrLink }>;

export interface NostrComponents {
  Event: NostrComponent;
}

const components: NostrComponents = {
  Event,
};

export function transformText(ps: Fragment[], tags: Array<string[]>, customComponents = components) {
  let fragments = extractEmoji(ps, tags);
  fragments = extractNprofiles(fragments);
  fragments = extractNevents(fragments, customComponents.Event);
  fragments = extractNaddrs(fragments, customComponents.Event);
  fragments = extractNoteIds(fragments, customComponents.Event);
  fragments = extractNpubs(fragments);
  fragments = extractLinks(fragments);

  return fragments;
}

interface TextProps {
  content: string;
  tags: Tags;
  customComponents?: NostrComponents;
}

export function Text({ content, tags, customComponents }: TextProps) {
  // todo: RTL langugage support
  const element = useMemo(() => {
    return <span className="text">{transformText([content], tags, customComponents)}</span>;
  }, [content, tags]);

  return <>{element}</>;
}
