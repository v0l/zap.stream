import { ExternalStore } from "@snort/shared";
import { useSyncExternalStore } from "react";

export const DefaultLocale = "en";

class LangStore extends ExternalStore<string> {
  setLang(lang: string) {
    localStorage.setItem("lang", lang);
    this.notifyChange();
  }

  takeSnapshot(): string {
    return localStorage.getItem("lang") ?? getLocale();
  }
}

const LangSelector = new LangStore();

export function useLang() {
  const store = useSyncExternalStore(
    c => LangSelector.hook(c),
    () => LangSelector.snapshot()
  );

  return {
    lang: store,
    setLang: (l: string) => LangSelector.setLang(l),
  };
}

export const getLocale = () => {
  return (navigator.languages && navigator.languages[0]) ?? navigator.language ?? DefaultLocale;
};
