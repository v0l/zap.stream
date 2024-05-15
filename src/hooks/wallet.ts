import { useEffect, useState } from "react";
import { LNWallet, WalletKind, loadWallet } from "@snort/wallet";
import { useLogin } from "./login";

export function useWallet() {
  const [wallet, setWallet] = useState<LNWallet>();
  const login = useLogin();

  function setupWallet(w: LNWallet | undefined) {
    if (login && w) {
      setWallet(w);
      w.on("change", d =>
        login.update(s => {
          if (s.wallet && d) {
            s.wallet.data = d;
          }
        })
      );
    }
  }

  useEffect(() => {
    if (login && !wallet && login.wallet) {
      loadWallet(login.wallet.type, login.wallet.data).then(setupWallet);
    } else if (login && !wallet && window.webln) {
      loadWallet(WalletKind.WebLN, undefined).then(setupWallet);
    }
  }, [wallet, login]);

  return wallet;
}
