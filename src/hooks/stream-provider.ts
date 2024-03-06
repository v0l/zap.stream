import { NostrStreamProvider, StreamProviderStore } from "@/providers";
import { ManualProvider } from "@/providers/manual";
import { findTag } from "@/utils";
import { NostrEvent } from "@snort/system";
import { useSyncExternalStore } from "react";

export function useStreamProvider() {
  return useSyncExternalStore(
    c => StreamProviderStore.hook(c),
    () => StreamProviderStore.snapshot()
  );
}

export function getCurrentStreamProvider(ev?: NostrEvent) {
  const providers = StreamProviderStore.snapshot();
  if (ev) {
    const service = findTag(ev, "service");
    if (service) {
      return new NostrStreamProvider("", service);
    } else {
      return new ManualProvider();
    }
  }
  return providers.at(0);
}
