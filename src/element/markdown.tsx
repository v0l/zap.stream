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
  let ctr = 0;
  function renderToken(t: Token): ReactNode {
    try {
      switch (t.type) {
        case "paragraph": {
          return <div key={ctr++}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</div>;
        }
        case "image": {
          return <img key={ctr++} src={t.href} />;
        }
        case "heading": {
          switch (t.depth) {
            case 1:
              return <h1 key={ctr++}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h1>;
            case 2:
              return <h2 key={ctr++}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h2>;
            case 3:
              return <h3 key={ctr++}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h3>;
            case 4:
              return <h4 key={ctr++}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h4>;
            case 5:
              return <h5 key={ctr++}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h5>;
            case 6:
              return <h6 key={ctr++}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</h6>;
          }
          throw new Error("Invalid heading");
        }
        case "codespan": {
          return <code key={ctr++}>{t.raw}</code>;
        }
        case "code": {
          return <pre key={ctr++}>{t.raw}</pre>;
        }
        case "br": {
          return <br key={ctr++} />;
        }
        case "hr": {
          return <hr key={ctr++} />;
        }
        case "blockquote": {
          return <blockquote key={ctr++}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</blockquote>;
        }
        case "link": {
          return (
            <HyperText link={t.href} key={ctr++}>
              {t.tokens ? t.tokens.map(renderToken) : t.raw}
            </HyperText>
          );
        }
        case "list": {
          if (t.ordered) {
            return <ol className="list-decimal ml-4">{(t.items as Token[]).map(renderToken)}</ol>;
          } else {
            return <ul className="list-disc">{(t.items as Token[]).map(renderToken)}</ul>;
          }
        }
        case "list_item": {
          return <li>{t.tokens ? t.tokens.map(renderToken) : t.raw}</li>;
        }
        case "em": {
          return <em key={ctr++}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</em>;
        }
        case "del": {
          return <s key={ctr++}>{t.tokens ? t.tokens.map(renderToken) : t.raw}</s>;
        }
        case "table": {
          return (
            <table className="table-auto border-collapse" key={ctr++}>
              <thead>
                <tr>
                  {(t.header as Tokens.TableCell[]).map(v => (
                    <th className="border" key={ctr++}>
                      {v.tokens ? v.tokens.map(renderToken) : v.text}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(t.rows as Tokens.TableCell[][]).map(v => (
                  <tr key={ctr++}>
                    {v.map((d, d_key) => (
                      <td className="border px-2 py-1" key={d_key}>
                        {d.tokens ? d.tokens.map(renderToken) : d.text}
                      </td>
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
          return <Text content={t.raw} tags={[]} key={ctr++} />;
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
