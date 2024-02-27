import classNames from "classnames";
import { HTMLProps } from "react";

export default function Pill({ children, selected, className, ...props }: HTMLProps<HTMLSpanElement>) {
    return <span {...props} className={classNames(className, { "bg-layer-3 font-bold": selected }, "px-2 py-1 font-semibold rounded-lg bg-layer-2 cursor-pointer text-sm")}>{children}</span>
}