import { StreamProviderStore } from "providers";
import { useSyncExternalStore } from "react";

export function useStreamProvider() {
  return useSyncExternalStore(
    (c) => StreamProviderStore.hook(c),
    () => StreamProviderStore.snapshot()
  );
}
