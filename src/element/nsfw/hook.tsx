import { useSyncExternalStore } from "react";
import { NSFWStore } from "./store";

export function useContentWarning() {
  const v = useSyncExternalStore(
    c => NSFWStore.hook(c),
    () => NSFWStore.snapshot(),
  );
  return v;
}
