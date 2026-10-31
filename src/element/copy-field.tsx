import Copy from "@/element/copy"
import { type ReactNode, useEffect, useRef } from "react"

export function CopyField({
  label,
  value,
  secret,
  showEnd,
}: {
  label?: ReactNode
  value: string
  secret?: boolean
  showEnd?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!showEnd) return
    const el = ref.current
    const toEnd = () => {
      if (el) el.scrollLeft = el.scrollWidth
    }
    toEnd()
    document.fonts?.ready.then(toEnd)
    const ro = new ResizeObserver(toEnd)
    if (el) ro.observe(el)
    return () => ro.disconnect()
  }, [showEnd, value])
  return (
    <label className="flex flex-col gap-1.5 min-w-0">
      {label && <span className="text-sm text-layer-4">{label}</span>}
      <span className="flex items-center rounded-xl bg-layer-0 border border-layer-3 pr-3">
        <input
          ref={ref}
          type={secret ? "password" : "text"}
          value={value}
          readOnly
          onFocus={e => e.currentTarget.select()}
          className="reset flex-1 min-w-0 bg-transparent px-3 py-2 font-mono text-sm"
        />
        <Copy text={value} hideText={true} />
      </span>
    </label>
  )
}
