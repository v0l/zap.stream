import classNames from "classnames"
import type { ReactNode } from "react"

export function OverlayCard({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div
      className={classNames(
        "inline-flex rounded-2xl border border-layer-3 bg-layer-1 px-5 py-3 text-lg font-semibold",
        className,
      )}
    >
      {children}
    </div>
  )
}
