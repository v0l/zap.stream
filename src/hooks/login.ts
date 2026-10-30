import { useMemo, useSyncExternalStore } from "react"

import { getPublisher, getSigner, Login, type LoginSession } from "@/login"

export function useLogin() {
  const session = useSyncExternalStore(
    c => Login.hook(c),
    () => Login.snapshot(),
    () => undefined,
  )
  return useMemo(() => {
    if (!session) return
    return {
      ...session,
      publisher: () => {
        return getPublisher(session)
      },
      signer: () => {
        return getSigner(session)
      },
      update: (fn: (s: LoginSession) => void) => {
        Login.update(fn)
      },
    }
  }, [session])
}
