import { Login } from "index";
import { useSyncExternalStore } from "react";

export function useLogin() {
  return useSyncExternalStore(
    (c) => Login.hook(c),
    () => Login.snapshot()
  );
}
