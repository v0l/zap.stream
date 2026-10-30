import type { ReactNode } from "react"

export function ModalSection({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-layer-4">{title}</h4>
      {children}
    </section>
  )
}
