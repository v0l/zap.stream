import { Icon } from "@/element/icon";
import classNames from "classnames";
import type { ReactNode } from "react";
import { Link, type LinkProps, useLocation } from "react-router";

export function NavLinkIcon({
  name,
  route,
  className,
  onClick,
  children,
}: {
  name: string;
  route?: string;
  className?: string;
  onClick?: LinkProps["onClick"];
  children?: ReactNode;
}) {
  const location = useLocation();
  const active = location.pathname === route;
  return (
    <Link
      to={route ?? "#"}
      onClick={onClick}
      className={classNames("cursor-pointer hover:bg-neutral-800 rounded-xl", { "opacity-50": !active }, className)}>
      <Icon name={name} size={20} className="m-2" />
      {children}
    </Link>
  );
}
