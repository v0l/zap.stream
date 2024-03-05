import type { ReactNode } from "react";
import { Icon } from "./icon";
import { Link } from "react-router-dom";

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
}

export function ExternalLink({ children, href }: ExternalLinkProps) {
  return (
    <Link to={href} rel="noopener noreferrer" target="_blank" className="text-primary">
      {children}
    </Link>
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
