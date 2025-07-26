import { HTMLProps } from "react";
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
        {
          "bg-primary": state === StreamState.Live,
          "bg-red-500": state === StreamState.Deleted,
          "bg-layer-1": state !== StreamState.Live && state !== StreamState.Deleted,
        },
        props.className,
      )}>
      {state}
    </Pill>
  );
}
