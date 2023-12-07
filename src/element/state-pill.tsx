import { HTMLProps } from "react";
import "./state-pill.css";
import { StreamState } from "@/index";
import classNames from "classnames";

type StatePillProps = { state: StreamState } & HTMLProps<HTMLSpanElement>;

export function StatePill({ state, ...props }: StatePillProps) {
  return (
    <span
      {...props}
      className={classNames(
        "uppercase font-white pill",
        state === StreamState.Live ? "bg-primary" : "bg-gray-1",
        props.className
      )}>
      {state}
    </span>
  );
}
