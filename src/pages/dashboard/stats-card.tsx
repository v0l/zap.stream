import classNames from "classnames";
import { HTMLProps, ReactNode } from "react";

export function DashboardStatsCard({
  name,
  value,
  ...props
}: { name: ReactNode; value: ReactNode } & Omit<HTMLProps<HTMLDivElement>, "children" | "name" | "value">) {
  return (
    <div
      {...props}
      className={classNames("flex-1 bg-layer-1 flex flex-col gap-1 px-4 py-2 rounded-xl", props.className)}>
      <div className="text-layer-4 font-medium">{name}</div>
      <div>{value}</div>
    </div>
  );
}
