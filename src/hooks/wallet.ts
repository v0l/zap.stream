import { useEffect, useState } from "react"
import { type LNWallet, WalletKind, loadWallet } from "@snort/wallet"
import { useLogin } from "./login"

export function useWallet() {
  const [wallet, setWallet] = useState<LNWallet>()
  const login = useLogin()

  useEffect(() => {
    if (!login || wallet) return
    let cancelled = false
    let loaded: LNWallet | undefined
    const onChange = (d: unknown) =>
      login.update(s => {
        if (s.wallet && d) {
          s.wallet.data = d as typeof s.wallet.data
        }
      })
    const setupWallet = (w: LNWallet | undefined) => {
      if (cancelled || !w) return
      loaded = w
      setWallet(w)
      w.on("change", onChange)
    }
    if (login.wallet) {
      loadWallet(login.wallet.type, login.wallet.data).then(setupWallet)
    } else if (window.webln) {
      loadWallet(WalletKind.WebLN, undefined).then(setupWallet)
    }
    return () => {
      cancelled = true
      loaded?.off("change", onChange)
    }
  }, [wallet, login])

  return wallet
}
