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
  function renderToken(t: Token, key: number): ReactNode {
    try {
      switch (t.type) {
        case "paragraph": {
          return <p key={key}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</p>;
        }
        case "image": {
          return <img key={key} src={t.href} />;
        }
        case "heading": {
          switch (t.depth) {
            case 1:
              return <h1 key={key}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h1>;
            case 2:
              return <h2 key={key}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h2>;
            case 3:
              return <h3 key={key}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h3>;
            case 4:
              return <h4 key={key}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h4>;
            case 5:
              return <h5 key={key}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h5>;
            case 6:
              return <h6 key={key}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h6>;
          }
          throw new Error("Invalid heading");
        }
        case "codespan": {
          return <code key={key}>{t.raw}</code>;
        }
        case "code": {
          return <pre key={key}>{t.raw}</pre>;
        }
        case "br": {
          return <br key={key} />;
        }
        case "hr": {
          return <hr key={key} />;
        }
        case "blockquote": {
          return <blockquote key={key}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</blockquote>;
        }
        case "link": {
          return <HyperText link={t.href} key={key}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</HyperText>;
        }
        case "list": {
          if (t.ordered) {
            return <ol key={key}>{t.items.map(renderToken)}</ol>;
          } else {
            return <ul key={key}>{t.items.map(renderToken)}</ul>;
          }
        }
        case "list_item": {
          return <li key={key}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</li>;
        }
        case "em": {
          return <em key={key}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</em>;
        }
        case "del": {
          return <s key={key}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</s>;
        }
        case "table": {
          return (
            <table className="table-auto border-collapse" key={key}>
              <thead>
                <tr>
                  {(t.header as Tokens.TableCell[]).map((v, h_key) => (
                    <th className="border" key={h_key}>{v.tokens ? v.tokens.map(renderToken) : v.text}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(t.rows as Tokens.TableCell[][]).map((v, r_key) => (
                  <tr key={r_key}>
                    {v.map((d, d_key) => (
                      <td className="border px-2 py-1" key={d_key}>{d.tokens ? d.tokens.map(renderToken) : d.text}</td>
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
          return <Text content={t.raw} tags={[]} key={key} />;
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
