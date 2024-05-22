import { DAY, HOUR, MINUTE, MONTH, WEEK } from "@/const";
import { FormattedMessage } from "react-intl";

export function RelativeTime({ from, suffix }: { from: number; suffix?: boolean }) {
  const diff = (new Date().getTime() - from) / 1000;
  const s = <FormattedMessage defaultMessage="ago" description="Relative time, ie. 1s ago" />;
  if (diff > MONTH) {
    return (
      <FormattedMessage
        defaultMessage="{m}mo {ago}"
        description="Number of month(s) relative to now"
        values={{ m: Math.floor(diff / MONTH).toFixed(0), ago: suffix ? s : undefined }}
      />
    );
  } else if (diff > WEEK) {
    return (
      <FormattedMessage
        defaultMessage="{m}w {ago}"
        description="Number of week(s) relative to now"
        values={{ m: Math.floor(diff / WEEK).toFixed(0), ago: suffix ? s : undefined }}
      />
    );
  } else if (diff > DAY) {
    return (
      <FormattedMessage
        defaultMessage="{m}d {ago}"
        description="Number of day(s) relative to now"
        values={{ m: Math.floor(diff / DAY).toFixed(0), ago: suffix ? s : undefined }}
      />
    );
  } else if (diff > HOUR) {
    return (
      <FormattedMessage
        defaultMessage="{m}h {ago}"
        description="Number of hour(s) relative to now"
        values={{ m: Math.floor(diff / HOUR).toFixed(0), ago: suffix ? s : undefined }}
      />
    );
  } else if (diff > MINUTE) {
    return (
      <FormattedMessage
        defaultMessage="{m}h {ago}"
        description="Number of minute(s) relative to now"
        values={{ m: Math.floor(diff / MINUTE).toFixed(0), ago: suffix ? s : undefined }}
      />
    );
  } else {
    return (
      <FormattedMessage
        defaultMessage="{m}s {ago}"
        description="Number of second(s) relative to now"
        values={{ m: Math.floor(diff).toFixed(0), ago: suffix ? s : undefined }}
      />
    );
  }
}
