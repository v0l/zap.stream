import "./markdown.css";

import { createElement } from "react";
import { parseNostrLink } from "@snort/system";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";

import { Address } from "element/Address";
import { Event } from "element/Event";
import { Mention } from "element/mention";
import { Emoji } from "element/emoji";
import { HyperText } from "element/hypertext";

const MentionRegex = /(#\[\d+\])/gi;
const NostrPrefixRegex = /^nostr:/;
const EmojiRegex = /:([\w-]+):/g;

function extractEmoji(fragments: Fragment[], tags: string[][]) {
  return fragments
    .map((f) => {
      if (typeof f === "string") {
        return f.split(EmojiRegex).map((i) => {
          const t = tags.find((a) => a[0] === "emoji" && a[1] === i);
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

function extractMentions(fragments, tags) {
  return fragments
    .map((f) => {
      if (typeof f === "string") {
        return f.split(MentionRegex).map((match) => {
          const matchTag = match.match(/#\[(\d+)\]/);
          if (matchTag && matchTag.length === 2) {
            const idx = parseInt(matchTag[1]);
            const ref = tags?.find((a, i) => i === idx);
            if (ref) {
              switch (ref[0]) {
                case "p": {
                  return <Mention key={ref[1]} pubkey={ref[1]} />;
                }
                case "a": {
                  return <Address link={parseNostrLink(ref[1])} />;
                }
                default:
                  // todo: e and t mentions
                  return ref[1];
              }
            }
            return null;
          } else {
            return match;
          }
        });
      }
      return f;
    })
    .flat();
}

function extractNprofiles(fragments) {
  return fragments
    .map((f) => {
      if (typeof f === "string") {
        return f.split(/(nostr:nprofile1[a-z0-9]+)/g).map((i) => {
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

function extractNpubs(fragments) {
  return fragments
    .map((f) => {
      if (typeof f === "string") {
        return f.split(/(nostr:npub1[a-z0-9]+)/g).map((i) => {
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

function extractNevents(fragments) {
  return fragments
    .map((f) => {
      if (typeof f === "string") {
        return f.split(/(nostr:nevent1[a-z0-9]+)/g).map((i) => {
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

function extractNaddrs(fragments) {
  return fragments
    .map((f) => {
      if (typeof f === "string") {
        return f.split(/(nostr:naddr1[a-z0-9]+)/g).map((i) => {
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

function extractNoteIds(fragments) {
  return fragments
    .map((f) => {
      if (typeof f === "string") {
        return f.split(/(nostr:note1[a-z0-9]+)/g).map((i) => {
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

function transformText(ps, tags) {
  let fragments = extractMentions(ps, tags);
  fragments = extractNprofiles(fragments);
  fragments = extractNevents(fragments);
  fragments = extractNaddrs(fragments);
  fragments = extractNoteIds(fragments);
  fragments = extractNpubs(fragments);
  fragments = extractEmoji(fragments, tags);

  return fragments;
}

interface MarkdownProps {
  content: string;
  tags?: string[];
  enableParagraphs?: booleam;
}

export function Markdown({
  content,
  tags = [],
  enableParagraphs = true,
  element = "div",
}: MarkdownProps) {
  const components = useMemo(() => {
    return {
      li: ({ children, ...props }) => {
        return children && <li {...props}>{transformText(children, tags)}</li>;
      },
      td: ({ children }) =>
        children && <td>{transformText(children, tags)}</td>,
      p: ({ children }) =>
        enableParagraphs ? (
          <p>{transformText(children, tags)}</p>
        ) : (
          transformText(children, tags)
        ),
      a: (props) => {
        return <HyperText link={props.href}>{props.children}</HyperText>;
      },
    };
  }, [tags, enableParagraphs]);
  return createElement(
    element,
    { className: "markdown" },
    <ReactMarkdown components={components}>{content}</ReactMarkdown>,
  );
}
