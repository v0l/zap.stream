import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "./icon";

export default function CategoryLink({ id, name, icon }: { id: string; name: ReactNode; icon: string }) {
  return (
    <Link
      to={`/category/${id}`}
      key={id}
      className="min-w-[10rem] flex items-center justify-between px-6 py-4 rounded-xl bg-layer-1">
      {name}
      <Icon name={icon} />
    </Link>
  );
}
