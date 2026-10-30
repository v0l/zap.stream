import { Icon } from "@/element/icon"
import classNames from "classnames"
import type { ReactNode } from "react"
import { Link, type LinkProps, useLocation } from "react-router"

export function NavLinkIcon({
  name,
  route,
  className,
  onClick,
  children,
}: {
  name: string
  route?: string
  className?: string
  onClick?: LinkProps["onClick"]
  children?: ReactNode
}) {
  const location = useLocation()
  // Treat the home page as the Streams route, and highlight on nested paths
  // (e.g. /category/gaming should keep the Categories item active).
  const path = location.pathname === "/" ? "/streams" : location.pathname
  const active = route ? path === route || path.startsWith(`${route}/`) : false
  return (
    <Link
      to={route ?? "#"}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={classNames(
        "flex items-center gap-3 rounded-lg font-medium cursor-pointer hover:bg-layer-2 hover:text-text",
        children ? "px-2.5 py-2" : "p-2",
        active ? "bg-layer-2 text-text shadow-[inset_3px_0_0_var(--color-primary)]" : "text-layer-4",
        className,
      )}
    >
      <Icon name={name} size={20} />
      {children}
    </Link>
  )
}
