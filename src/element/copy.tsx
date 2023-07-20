import "./copy.css";
import { useCopy } from "hooks/copy";
import { Icon } from "./icon";

export interface CopyProps {
  text: string;
  maxSize?: number;
  className?: string;
}
export default function Copy({ text, maxSize = 32, className }: CopyProps) {
  const { copy, copied } = useCopy();
  const sliceLength = maxSize / 2;
  const trimmed = text.length > maxSize ? `${text.slice(0, sliceLength)}...${text.slice(-sliceLength)}` : text;

  return (
    <div className={`copy${className ? ` ${className}` : ""}`} onClick={() => copy(text)}>
      <span className="body">{trimmed}</span>
      <span className="icon" style={{ color: copied ? "var(--success)" : "var(--highlight)" }}>
        {copied ? <Icon name="check" size={14} /> : <Icon name="copy" size={14} />}
      </span>
    </div>
  );
}
