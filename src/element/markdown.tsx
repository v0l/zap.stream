import "./markdown.css";

import { createElement } from "react";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";

import { HyperText } from "element/hypertext";
import { transformText } from "element/text";

interface MarkdownProps {
  content: string;
  tags?: string[];
}

export function Markdown({
  content,
  tags = [],
  element = "div",
}: MarkdownProps) {
  const components = useMemo(() => {
    return {
      li: ({ children, ...props }) => {
        return children && <li {...props}>{transformText(children, tags)}</li>;
      },
      td: ({ children }) =>
        children && <td>{transformText(children, tags)}</td>,
      p: ({ children }) => <p>{transformText(children, tags)}</p>,
      a: (props) => {
        return <HyperText link={props.href}>{props.children}</HyperText>;
      },
    };
  }, [tags]);
  return createElement(
    element,
    { className: "markdown" },
    <ReactMarkdown components={components}>{content}</ReactMarkdown>,
  );
}
