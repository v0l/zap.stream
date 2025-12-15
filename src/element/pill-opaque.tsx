import classNames from "classnames";
import type { HTMLProps } from "react";

export default function PillOpaque({ children, selected, className, ...props }: HTMLProps<HTMLDivElement>) {
  return (
    <div className="relative overflow-hidden px-2 py-1 cursor-pointer text-sm">
      <div
        {...props}
        className={classNames(
          { "bg-layer-3 font-bold": selected },
          "absolute w-full h-full top-0 left-0 font-semibold rounded-lg bg-layer-2 opacity-60",
        )}></div>
      <div className={classNames(className, "relative")}>{children}</div>
    </div>
  );
}
