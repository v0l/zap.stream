import { Login } from "index";
import { getPublisher } from "login";
import { useSyncExternalStore } from "react";

export function useLogin() {
  const session = useSyncExternalStore(
    (c) => Login.hook(c),
    () => Login.snapshot()
  );
  if (!session) return;
  return {
    ...session,
    publisher: () => {
      return getPublisher(session);
    }
  }
}
