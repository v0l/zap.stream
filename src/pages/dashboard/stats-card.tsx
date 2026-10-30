import classNames from "classnames"
import type { HTMLProps, ReactNode } from "react"

export function DashboardStatsCard({
  name,
  value,
  ...props
}: { name: ReactNode; value: ReactNode } & Omit<HTMLProps<HTMLDivElement>, "children" | "name" | "value">) {
  return (
    <div {...props} className={classNames("flex-1 min-w-0 flex flex-col", props.className)}>
      <div className="text-sm text-layer-4">{name}</div>
      <div className="font-display text-[clamp(18px,5vw,24px)] font-extrabold tabular-nums">{value}</div>
    </div>
  )
}
