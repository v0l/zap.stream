import "./markdown.css";

import { ReactNode, forwardRef, useMemo } from "react";
import { Token, Tokens, marked } from "marked";
import { HyperText } from "./hypertext";
import { Text } from "./text";

interface MarkdownProps {
  content: string;
  tags?: Array<Array<string>>;

  // Render plain text directly without parsing nostr/http links
  plainText?: boolean;
}

const Markdown = forwardRef<HTMLDivElement, MarkdownProps>((props: MarkdownProps, ref) => {
  function renderToken(t: Token): ReactNode {
    try {
      switch (t.type) {
        case "paragraph": {
          return <p>{t.tokens ? t.tokens.map(renderToken) : t.raw}</p>;
        }
        case "image": {
          return <img src={t.href} />;
        }
        case "heading": {
          switch (t.depth) {
            case 1:
              return <h1>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h1>;
            case 2:
              return <h2>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h2>;
            case 3:
              return <h3>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h3>;
            case 4:
              return <h4>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h4>;
            case 5:
              return <h5>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h5>;
            case 6:
              return <h6>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h6>;
          }
          throw new Error("Invalid heading");
        }
        case "codespan": {
          return <code>{t.raw}</code>;
        }
        case "code": {
          return <pre>{t.raw}</pre>;
        }
        case "br": {
          return <br />;
        }
        case "hr": {
          return <hr />;
        }
        case "blockquote": {
          return <blockquote>{t.tokens ? t.tokens.map(renderToken) : t.raw}</blockquote>;
        }
        case "link": {
          return <HyperText link={t.href}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</HyperText>;
        }
        case "list": {
          if (t.ordered) {
            return <ol>{t.items.map(renderToken)}</ol>;
          } else {
            return <ul>{t.items.map(renderToken)}</ul>;
          }
        }
        case "list_item": {
          return <li>{t.tokens ? t.tokens.map(renderToken) : t.raw}</li>;
        }
        case "em": {
          return <em>{t.tokens ? t.tokens.map(renderToken) : t.raw}</em>;
        }
        case "del": {
          return <s>{t.tokens ? t.tokens.map(renderToken) : t.raw}</s>;
        }
        case "table": {
          return (
            <table className="table-auto border-collapse">
              <thead>
                <tr>
                  {(t.header as Tokens.TableCell[]).map(v => (
                    <th className="border">{v.tokens ? v.tokens.map(renderToken) : v.text}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(t.rows as Tokens.TableCell[][]).map(v => (
                  <tr>
                    {v.map(d => (
                      <td className="border px-2 py-1">{d.tokens ? d.tokens.map(renderToken) : d.text}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
        default: {
          if ("tokens" in t) {
            return (t.tokens as Array<Token>).map(renderToken);
          }
          if (props.plainText ?? false) {
            return t.raw;
          }
          return <Text content={t.raw} tags={[]} />;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  const parsed = useMemo(() => {
    return marked.lexer(props.content);
  }, [props.content, props.tags]);

  return (
    <div className="markdown" ref={ref}>
      {parsed.filter(a => a.type !== "footnote" && a.type !== "footnotes").map(a => renderToken(a))}
    </div>
  );
});

export default Markdown;
