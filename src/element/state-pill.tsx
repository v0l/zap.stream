import { HTMLProps } from "react";
import "./state-pill.css";
import { StreamState } from "@/index";

type StatePillProps = { state: StreamState } & HTMLProps<HTMLSpanElement>;

export function StatePill({ state, ...props }: StatePillProps) {
  return (
    <span {...props} className={`uppercase font-white pill ${state === StreamState.Live ? "bg-primary" : "bg-gray-1"}`}>
      {state}
    </span>
  );
}
