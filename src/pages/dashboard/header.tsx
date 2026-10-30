import { StreamState } from "@/const"
import classNames from "classnames"
import type { ReactNode } from "react"
import { FormattedMessage } from "react-intl"

export function DashboardHeader({ title, status, actions }: { title?: string; status?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1 min-w-0">
        <StatusLine status={status} />
        <h1 className="text-[clamp(24px,2.6vw,34px)] leading-tight truncate">
          {title || <FormattedMessage defaultMessage="Creator dashboard" />}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </header>
  )
}

function StatusLine({ status }: { status?: string }) {
  const live = status === StreamState.Live
  const planned = status === StreamState.Planned
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold">
      <span
        className={classNames("w-2.5 h-2.5 rounded-full", {
          "bg-primary shadow-[0_0_0_4px_rgb(255_176_0/0.22)] motion-safe:animate-pulse": live,
          "bg-signal": planned,
          "bg-layer-4": !live && !planned,
        })}
      />
      {live ? (
        <FormattedMessage defaultMessage="You're live" />
      ) : planned ? (
        <FormattedMessage defaultMessage="Planned" />
      ) : (
        <span className="text-layer-4">
          <FormattedMessage defaultMessage="Offline" />
        </span>
      )}
    </span>
  )
}
