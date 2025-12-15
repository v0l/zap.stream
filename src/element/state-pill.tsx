import type { HTMLProps } from "react";
import "./state-pill.css";
import classNames from "classnames";
import { StreamState } from "@/const";
import Pill from "./pill";

type StatePillProps = { state: StreamState } & HTMLProps<HTMLDivElement>;

export function StatePill({ state, ...props }: StatePillProps) {
  return (
    <Pill
      {...props}
      className={classNames(
        "uppercase font-white",
        state === StreamState.Live ? "bg-primary" : "bg-layer-1",
        props.className,
      )}>
      {state}
    </Pill>
  );
}
