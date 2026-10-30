import classNames from "classnames"
import type { HTMLProps, ReactNode } from "react"

export function DashboardCard({
  title,
  headerAction,
  children,
  className,
  bodyClassName,
  flush,
  ...props
}: { title?: ReactNode; headerAction?: ReactNode; bodyClassName?: string; flush?: boolean } & Omit<
  HTMLProps<HTMLDivElement>,
  "title"
>) {
  return (
    <section
      {...props}
      className={classNames("flex flex-col rounded-2xl border border-layer-3 bg-layer-1 min-h-0", className)}
    >
      {(title || headerAction) && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-layer-3">
          {title && <h2 className="font-sans text-[15px] font-semibold tracking-normal">{title}</h2>}
          {headerAction}
        </header>
      )}
      <div className={classNames("flex flex-col min-h-0", flush ? "" : "p-4 gap-4", bodyClassName)}>{children}</div>
    </section>
  )
}
