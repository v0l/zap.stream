import type { ReactNode } from "react"

export default function VideoGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-x-5 gap-y-7 grid-cols-[repeat(auto-fill,minmax(min(268px,100%),1fr))] items-start">
      {children}
    </div>
  )
}
