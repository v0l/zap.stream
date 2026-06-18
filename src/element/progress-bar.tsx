import type { HTMLProps, ReactNode } from "react"

type ProgressBarProps = {
  value: number
  setValue: (n: number) => void
  marker?: ReactNode
} & Omit<HTMLProps<HTMLDivElement>, "width">

export function ProgressBar({ value, setValue, marker, ...props }: ProgressBarProps) {
  function onValue(e: React.MouseEvent) {
    const bb = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const x = e.clientX - bb.x
    const pos = Math.max(0, Math.min(1.0, x / bb.width))
    setValue(pos)
  }
  return (
    <div
      {...props}
      className="relative pointer border bg-[rgba(255,255,255,0.25)]"
      role="slider"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={value}
      onMouseDown={onValue}
      onMouseMove={e => {
        if (e.buttons > 0) {
          onValue(e)
        }
      }}
      onKeyDown={e => {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          setValue(Math.max(0, value - 0.05))
        } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          setValue(Math.min(1, value + 0.05))
        }
      }}
    >
      <div
        className="absolute h-full bg-white"
        style={{
          width: `${Math.ceil(100 * value)}%`,
        }}
      >
        {marker && <div className="absolute right-0 flex items-center justify-center">{marker}</div>}
      </div>
    </div>
  )
}
