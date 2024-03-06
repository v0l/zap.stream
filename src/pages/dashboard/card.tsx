import classNames from "classnames";
import { HTMLProps } from "react";

export function DashboardCard(props: HTMLProps<HTMLDivElement>) {
  return (
    <div {...props} className={classNames("px-4 py-6 rounded-3xl border border-layer-1", props.className)}>
      {props.children}
    </div>
  );
}
