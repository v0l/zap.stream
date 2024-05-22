import { HOUR, MINUTE } from "@/const";

export function VideoDuration({ value }: { value: number }) {
  // array of time parts, [seconds, minutes, {hours}]
  const parts: Array<number> = [0, 0];

  parts[0] = Math.floor(value % MINUTE);
  parts[1] = Math.floor((value % HOUR) / MINUTE);

  const hours = Math.floor(value / HOUR);
  if (hours >= 1) {
    parts.push(hours);
  }
  return parts
    .reverse()
    .map(a => a.toFixed().padStart(2, "0"))
    .join(":");
}
