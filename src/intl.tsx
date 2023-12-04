import { DefaultLocale, useLang } from "@/hooks/lang";
import { type ReactNode, useEffect, useState } from "react";
import { IntlProvider as ReactIntlProvider } from "react-intl";

import enMessages from "@/translations/en.json";

export const AllLocales = [
  DefaultLocale,
  "de-DE",
  "es-ES",
  "th-TH",
  "nl-NL",
  "ja-JP",
  "fa-IR",
  "sw-KE",
  "sv-SE",
  "bn-BD",
  "bg-BG",
  "zh-CN",
  "zh-TW",
  "fi-FI",
  "fr-FR",
  "pt-BR",
  "ru-RU",
];

function importLang(src: { default: Record<string, { defaultMessage: string }> }) {
  const ent = Object.entries(src.default).map(([k, v]) => [k, v.defaultMessage]);
  return Object.fromEntries(ent) as Record<string, string>;
}

const getMessages = (locale: string) => {
  const truncatedLocale = locale.toLowerCase().split(/[_-]+/)[0];

  const matchLang = async (lng: string) => {
    switch (lng) {
      case "de":
      case "de-DE":
        return importLang(await import("@/translations/de_DE.json"));
      case "es":
      case "es-ES":
        return importLang(await import("@/translations/es_ES.json"));
      case "th":
      case "th-TH":
        return importLang(await import("@/translations/th_TH.json"));
      case "nl":
      case "nl-NL":
        return importLang(await import("@/translations/nl_NL.json"));
      case "ja":
      case "ja-JP":
        return importLang(await import("@/translations/ja_JP.json"));
      case "fa":
      case "fa-IR":
        return importLang(await import("@/translations/fa_IR.json"));
      case "sw":
      case "sw-KE":
        return importLang(await import("@/translations/sw_KE.json"));
      case "sv":
      case "sv-SE":
        return importLang(await import("@/translations/sv_SE.json"));
      case "bn":
      case "bn-BD":
        return importLang(await import("@/translations/bn_BD.json"));
      case "bg":
      case "bg-BG":
        return importLang(await import("@/translations/bg_BG.json"));
      case "zh":
      case "zh-CN":
        return importLang(await import("@/translations/zh_CN.json"));
      case "zh-TW":
        return importLang(await import("@/translations/zh_TW.json"));
      case "fi":
      case "fi-FI":
        return importLang(await import("@/translations/fi_FI.json"));
      case "fr":
      case "fr-FR":
        return importLang(await import("@/translations/fr_FR.json"));
      case "pt-BR":
        return importLang(await import("@/translations/pt_BR.json"));
      case "ru":
      case "ru-RU":
        return importLang(await import("@/translations/ru_RU.json"));
      case DefaultLocale:
      case "en":
        return enMessages;
    }
  };

  return matchLang(locale) ?? matchLang(truncatedLocale) ?? Promise.resolve(enMessages);
};

export const IntlProvider = ({ children }: { children: ReactNode }) => {
  const { lang: locale } = useLang();
  const [messages, setMessages] = useState<Record<string, string>>(enMessages);

  useEffect(() => {
    getMessages(locale).then(a => setMessages(a as Record<string, string>));
  }, [locale]);

  return (
    <ReactIntlProvider locale={locale} messages={messages}>
      {children}
    </ReactIntlProvider>
  );
};
