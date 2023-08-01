import { useEffect, useState } from "react";
import { NostrEvent } from "@snort/system";
import { unixNow } from "@snort/shared";
import { findTag } from "../utils";

export function StreamTimer({ ev }: { ev?: NostrEvent }) {
  const [time, setTime] = useState("");

  function updateTime() {
    const starts = Number(findTag(ev, "starts") ?? unixNow());
    const diff = unixNow() - starts;
    const hours = Number(diff / 60.0 / 60.0);
    const mins = Number((diff / 60) % 60);
    setTime(
      `${hours.toFixed(0).padStart(2, "0")}:${mins.toFixed(0).padStart(2, "0")}`
    );
  }

  useEffect(() => {
    updateTime();
    const t = setInterval(() => {
      updateTime();
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return time;
}
