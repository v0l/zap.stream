import "./markdown.css";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";

import { HyperText } from "element/hypertext";
import { transformText, type Fragment } from "element/text";
import type { Tags } from "types";

interface MarkdownProps {
  content: string;
  tags?: Tags;
}

interface LinkProps {
  href?: string;
  children?: Array<Fragment>;
}

interface ComponentProps {
  children?: Array<Fragment>;
}

export function Markdown({ content, tags = [] }: MarkdownProps) {
  const components = useMemo(() => {
    return {
      li: ({ children, ...props }: ComponentProps) => {
        return children && <li {...props}>{transformText(children, tags)}</li>;
      },
      td: ({ children }: ComponentProps) => {
        return children && <td>{transformText(children, tags)}</td>;
      },
      th: ({ children }: ComponentProps) => {
        return children && <th>{transformText(children, tags)}</th>;
      },
      p: ({ children }: ComponentProps) => {
        return children && <p>{transformText(children, tags)}</p>;
      },
      a: ({ href, children }: LinkProps) => {
        return href && <HyperText link={href}>{children}</HyperText>;
      },
    };
  }, [tags]);
  return (
    <div className="markdown">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
