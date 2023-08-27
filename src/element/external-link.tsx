import type { ReactNode } from "react";
import { Icon } from "element/icon";

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
}

export function ExternalLink({ children, href }: ExternalLinkProps) {
  return (
    <a href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
}

interface ExternalIconLinkProps extends Omit<ExternalLinkProps, "children"> {
  className?: string;
  size?: number;
}

export function ExternalIconLink({ size = 32, href, ...rest }: ExternalIconLinkProps) {
  return (
    <span style={{ cursor: "pointer" }}>
      <Icon name="link" size={size} onClick={() => window.open(href, "_blank")} {...rest} />
    </span>
  );
}
