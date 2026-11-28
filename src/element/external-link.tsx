import type { ReactNode } from "react"
import { Link } from "react-router"
import { Icon } from "./icon"

const ALLOWED_EXTERNAL_SCHEMES = new Set([
  "http:",
  "https:",
  "mailto:",
  "nostr:",
  "web+nostr:",
  "lightning:",
  "lnurl:",
  "magnet:",
  "blossom:",
])

// biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting control characters is the point
const CONTROL_CHAR_REGEX = /[\u0000-\u001f\u007f]/

/**
 * Returns the trimmed URL if it parses with an explicitly allowed external
 * scheme, or undefined otherwise. Blocks javascript:, data:, vbscript:, blob:,
 * file:, protocol-relative (//) and malformed inputs regardless of upstream
 * regex behavior.
 */
export function safeExternalHref(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (!trimmed || CONTROL_CHAR_REGEX.test(trimmed)) return undefined

  try {
    const parsed = new URL(trimmed)
    if (!ALLOWED_EXTERNAL_SCHEMES.has(parsed.protocol)) return undefined
  } catch {
    return undefined
  }

  return trimmed
}

interface ExternalLinkProps {
  href: string
  children?: ReactNode
  className?: string
}

export function ExternalLink({ children, href, className }: ExternalLinkProps) {
  const safeHref = safeExternalHref(href)
  if (!safeHref) {
    // degrade blocked links to inert text while preserving visible content
    return <span className={className}>{children ?? href}</span>
  }
  return (
    <Link to={safeHref} rel="noopener noreferrer" target="_blank" className="text-primary">
      {children}
    </Link>
  )
}

interface ExternalIconLinkProps extends Omit<ExternalLinkProps, "children"> {
  className?: string
  size?: number
}

export function ExternalIconLink({ size = 32, href, ...rest }: ExternalIconLinkProps) {
  const safeHref = safeExternalHref(href)
  return (
    <span style={{ cursor: "pointer" }}>
      <Icon name="link" size={size} onClick={() => safeHref && window.open(safeHref, "_blank", "noopener,noreferrer")} {...rest} />
    </span>
  )
}
