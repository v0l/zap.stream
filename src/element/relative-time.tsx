import { DAY, HOUR, MINUTE, MONTH, WEEK } from "@/const";
import { FormattedMessage } from "react-intl";

export function RelativeTime({ from }: { from: number }) {
  const diff = (new Date().getTime() - from) / 1000;
  if (diff > MONTH) {
    return (
      <FormattedMessage
        defaultMessage="{m}mo"
        description="Number of month(s) relative to now"
        values={{ m: Math.floor(diff / MONTH).toFixed(0) }}
      />
    );
  } else if (diff > WEEK) {
    return (
      <FormattedMessage
        defaultMessage="{m}w"
        description="Number of week(s) relative to now"
        values={{ m: Math.floor(diff / WEEK).toFixed(0) }}
      />
    );
  } else if (diff > DAY) {
    return (
      <FormattedMessage
        defaultMessage="{m}d"
        description="Number of day(s) relative to now"
        values={{ m: Math.floor(diff / DAY).toFixed(0) }}
      />
    );
  } else if (diff > HOUR) {
    return (
      <FormattedMessage
        defaultMessage="{m}h"
        description="Number of hour(s) relative to now"
        values={{ m: Math.floor(diff / HOUR).toFixed(0) }}
      />
    );
  } else if (diff > MINUTE) {
    return (
      <FormattedMessage
        defaultMessage="{m}h"
        description="Number of minute(s) relative to now"
        values={{ m: Math.floor(diff / MINUTE).toFixed(0) }}
      />
    );
  } else {
    return (
      <FormattedMessage
        defaultMessage="{m}s"
        description="Number of second(s) relative to now"
        values={{ m: Math.floor(diff).toFixed(0) }}
      />
    );
  }
}
