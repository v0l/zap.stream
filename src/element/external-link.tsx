import { Icon } from "element/icon";

export function ExternalIconLink({ size = 32, href, ...rest }) {
  return (
    <span style={{ cursor: "pointer" }}>
      <Icon
        name="link"
        size={size}
        onClick={() => window.open(href, "_blank")}
        {...rest}
      />
    </span>
  );
}

export function ExternalLink({ children, href }) {
  return (
    <a href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
}
