import "./state-pill.css";
import { StreamState } from "index";

export function StatePill({ state }: { state: StreamState }) {
  return (
    <span className={`state pill${state === StreamState.Live ? " live" : ""}`}>
      {state}
    </span>
  );
}
