import { useEffect, useState } from "react";
import { NostrEvent } from "@snort/system";
import { unixNow } from "@snort/shared";
import { findTag } from "@/utils";

export function StreamTimer({ ev }: { ev?: NostrEvent }) {
  const [time, setTime] = useState("");

  function updateTime() {
    const starts = Number(findTag(ev, "starts") ?? unixNow());
    const diff = unixNow() - starts;
    const min = 60;
    const hour = min * 60;

    const hours = Math.floor(diff / hour);
    const mins = Math.floor((diff % hour) / min);
    const secs = Math.floor(diff % min);
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
