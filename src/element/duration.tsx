import { FormattedMessage } from "react-intl"

export function splitDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds / 60))
  return {
    days: Math.floor(total / 1440),
    hours: Math.floor((total % 1440) / 60),
    minutes: total % 60,
  }
}

export function Duration({ seconds }: { seconds: number }) {
  const { days, hours, minutes } = splitDuration(seconds)
  if (days > 0) {
    return <FormattedMessage defaultMessage="{d}d {h}h {m}m" values={{ d: days, h: hours, m: minutes }} />
  }
  if (hours > 0) {
    return <FormattedMessage defaultMessage="{h}h {m}m" values={{ h: hours, m: minutes }} />
  }
  return <FormattedMessage defaultMessage="{m}m" values={{ m: minutes }} />
}
