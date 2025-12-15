import { useMemo, useSyncExternalStore } from "react";
import { NostrStreamProvider } from "@/providers";
import { useLogin } from "./login";
import { ExternalStore } from "@snort/shared";
import type { EventPublisher, NostrEvent } from "@snort/system";
import { ZAP_STREAM_PUBKEY } from "@/const";

export interface StreamProviderConfig {
  name: string;
  url: string;
  description?: string;
  pubkey: string;
  event?: NostrEvent;
  recommendations: Array<NostrEvent>;
  // A score by WoT distance, lower is better
  score: number;
}

const DEFAULT_CONFIG: StreamProviderConfig = {
  name: "zap.stream",
  url: "https://api-core.zap.stream/api/v1",
  pubkey: ZAP_STREAM_PUBKEY,
  recommendations: [],
  score: 0,
};

const STORAGE_KEY = "stream-provider";

class ProviderStorage extends ExternalStore<StreamProviderConfig> {
  #currentConfig: StreamProviderConfig;

  constructor() {
    super();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.#currentConfig = stored ? JSON.parse(stored) : DEFAULT_CONFIG;
    } catch {
      this.#currentConfig = DEFAULT_CONFIG;
    }
  }

  getProvider(pub: EventPublisher | undefined) {
    return new NostrStreamProvider(this.#currentConfig.name, this.#currentConfig.url, pub);
  }

  setProvider(cfg: StreamProviderConfig) {
    this.#currentConfig = cfg;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#currentConfig));
    this.notifyChange();
  }

  takeSnapshot(): StreamProviderConfig {
    return {
      ...this.#currentConfig,
    };
  }
}

const Storage = new ProviderStorage();

export function useStreamProvider() {
  const login = useLogin();
  const config = useSyncExternalStore(
    c => Storage.hook(c),
    () => Storage.snapshot(),
  );

  return useMemo(
    () => ({
      provider: new NostrStreamProvider(config.name, config.url, login?.publisher()),
      config,
      updateStreamProvider: (cfg: StreamProviderConfig) => {
        Storage.setProvider(cfg);
      },
      resetToDefault: () => {
        Storage.setProvider(DEFAULT_CONFIG);
      },
    }),
    [config],
  );
}
