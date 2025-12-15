import type { ReactNode } from "react";
import { Link } from "react-router";
import { Icon } from "../icon";
import classNames from "classnames";

export default function CategoryLink({
  id,
  name,
  icon,
  className,
}: {
  id: string;
  name: ReactNode;
  icon: string;
  className?: string;
}) {
  return (
    <Link
      to={`/category/${id}`}
      key={id}
      className={classNames(
        "text-lg font-semibold rounded-xl border border-layer-2 border-2 hover:bg-layer-2",
        className,
      )}>
      <div className="flex items-center gap-2 px-2 py-1 whitespace-nowrap">
        <Icon name={icon} size={24} />
        {name}
      </div>
    </Link>
  );
}
