import "./markdown.css";

import ReactMarkdown from "react-markdown";

export function Markdown({ children }) {
  return (
    <div className="markdown">
      <ReactMarkdown children={children} />
    </div>
  );
}
