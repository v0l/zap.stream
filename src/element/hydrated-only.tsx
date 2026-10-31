import { useHydrated } from "@/hooks/hydrated"
import type { ReactNode } from "react"

export function HydratedOnly({ children }: { children: ReactNode }) {
  return useHydrated() ? children : null
}
