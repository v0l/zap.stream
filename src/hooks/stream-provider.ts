import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { NostrStreamProvider } from "@/providers";
import { useLogin } from "./login";
import { ExternalStore } from "@snort/shared";
import { EventPublisher } from "@snort/system";

interface StreamProviderConfig {
  name: string;
  url: string;
}

const DEFAULT_CONFIG: StreamProviderConfig = {
  name: "zap.stream",
  url: "https://api-core.zap.stream/api/v1",
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

  return {
    provider: new NostrStreamProvider(config.name, config.url, login?.publisher()),
    config,
    updateStreamProvider: (cfg: StreamProviderConfig) => {
      Storage.setProvider(cfg);
    },
    resetToDefault: () => {
      Storage.setProvider(DEFAULT_CONFIG);
    },
  };
}
