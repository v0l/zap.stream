import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "./icon";
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
        "min-w-[12rem] flex items-center justify-between gap-4 px-6 py-2 text-xl font-semibold rounded-xl",
        className
      )}>
      {name}
      <Icon name={icon} />
    </Link>
  );
}
