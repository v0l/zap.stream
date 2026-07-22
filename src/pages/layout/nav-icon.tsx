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
      className={classNames("cursor-pointer hover:bg-neutral-800 rounded-xl", { "opacity-50": !active }, className)}
    >
      <Icon name={name} size={20} className="m-2" />
      {children}
    </Link>
  )
}
