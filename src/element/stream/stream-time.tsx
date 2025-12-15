import { useEffect, useState } from "react";
import type { NostrEvent } from "@snort/system";
import { unixNow } from "@snort/shared";
import { findTag } from "@/utils";
import { HOUR, MINUTE } from "@/const";

export function StreamTimer({ ev }: { ev?: NostrEvent }) {
  const [time, setTime] = useState("");

  function updateTime() {
    const starts = Number(findTag(ev, "starts") ?? unixNow());
    const diff = unixNow() - starts;

    const hours = Math.floor(diff / HOUR);
    const mins = Math.floor((diff % HOUR) / MINUTE);
    const secs = Math.floor(diff % MINUTE);
    setTime(
      `${hours.toFixed(0).padStart(2, "0")}:${mins.toFixed(0).padStart(2, "0")}:${secs.toFixed(0).padStart(2, "0")}`,
    );
  }

  useEffect(() => {
    updateTime();
    const t = setInterval(() => {
      updateTime();
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return <span className="tnum">{time}</span>;
}
