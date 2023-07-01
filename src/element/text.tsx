import { useMemo, type ReactNode } from "react";
import { validateNostrLink } from "@snort/system";
import { splitByUrl } from "utils";
import { Emoji } from "./emoji";
import { HyperText } from "./hypertext";

type Fragment = string | ReactNode;

function transformText(fragments: Fragment[], tags: string[][]) {
  return extractLinks(extractEmoji(fragments, tags));
}

function extractEmoji(fragments: Fragment[], tags: string[][]) {
  return fragments
    .map((f) => {
      if (typeof f === "string") {
        return f.split(/:([\w-]+):/g).map((i) => {
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

function extractLinks(fragments: Fragment[]) {
  return fragments
    .map((f) => {
      if (typeof f === "string") {
        return splitByUrl(f).map((a) => {
          const validateLink = () => {
            const normalizedStr = a.toLowerCase();

            if (
              normalizedStr.startsWith("web+nostr:") ||
              normalizedStr.startsWith("nostr:")
            ) {
              return validateNostrLink(normalizedStr);
            }

            return (
              normalizedStr.startsWith("http:") ||
              normalizedStr.startsWith("https:") ||
              normalizedStr.startsWith("magnet:")
            );
          };

          if (validateLink()) {
            if (!a.startsWith("nostr:")) {
              return (
                <a
                  href={a}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noreferrer"
                  className="ext"
                >
                  {a}
                </a>
              );
            }
            return <HyperText link={a} />;
          }
          return a;
        });
      }
      return f;
    })
    .flat();
}

export function Text({ content, tags }: { content: string; tags: string[][] }) {
  // todo: RTL langugage support
  const element = useMemo(() => {
    return <span>{transformText([content], tags)}</span>;
  }, [content, tags]);

  return <>{element}</>;
}
