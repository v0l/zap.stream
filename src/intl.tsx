import { DefaultLocale, useLang } from "@/hooks/lang";
import { type ReactNode, useEffect, useState } from "react";
import { IntlProvider as ReactIntlProvider } from "react-intl";

import enMessages from "@/translations/en.json";

export const AllLocales = [
  DefaultLocale,
  "ar-SA",
  "bg-BG",
  "bn-BD",
  "da-DK",
  "de-DE",
  "es-ES",
  "fa-IR",
  "fi-FI",
  "fr-FR",
  "hu-HU",
  "it-IT",
  "ja-JP",
  "ko-KR",
  "nl-NL",
  "pt-BR",
  "ru-RU",
  "sv-SE",
  "sw-KE",
  "th-TH",
  "zh-CN",
  "zh-TW",
];

function importLang(src: { default: Record<string, { defaultMessage: string }> }) {
  const ent = Object.entries(src.default).map(([k, v]) => [k, v.defaultMessage]);
  return Object.fromEntries(ent) as Record<string, string>;
}

const getMessages = (locale: string) => {
  const truncatedLocale = locale.toLowerCase().split(/[_-]+/)[0];

  const matchLang = async (lng: string) => {
    switch (lng) {
      case "ar":
      case "ar-SA":
        return importLang(await import("@/translations/ar_SA.json"));
      case "bg":
      case "bg-BG":
        return importLang(await import("@/translations/bg_BG.json"));
      case "bn":
      case "bn-BD":
        return importLang(await import("@/translations/bn_BD.json"));
      case "da":
      case "da-DK":
        return importLang(await import("@/translations/da_DK.json"));
      case "de":
      case "de-DE":
        return importLang(await import("@/translations/de_DE.json"));
      case "es":
      case "es-ES":
        return importLang(await import("@/translations/es_ES.json"));
      case "fa":
      case "fa-IR":
        return importLang(await import("@/translations/fa_IR.json"));
      case "fi":
      case "fi-FI":
        return importLang(await import("@/translations/fi_FI.json"));
      case "fr":
      case "fr-FR":
        return importLang(await import("@/translations/fr_FR.json"));
      case "hu":
      case "hu-HU":
        return importLang(await import("@/translations/hu_HU.json"));
      case "it":
      case "it-IT":
        return importLang(await import("@/translations/it_IT.json"));
      case "ja":
      case "ja-JP":
        return importLang(await import("@/translations/ja_JP.json"));
      case "ko":
      case "ko-KR":
        return importLang(await import("@/translations/ko_KR.json"));
      case "nl":
      case "nl-NL":
        return importLang(await import("@/translations/nl_NL.json"));
      case "pt":
      case "pt-BR":
        return importLang(await import("@/translations/pt_BR.json"));
      case "ru":
      case "ru-RU":
        return importLang(await import("@/translations/ru_RU.json"));
      case "sv":
      case "sv-SE":
        return importLang(await import("@/translations/sv_SE.json"));
      case "sw":
      case "sw-KE":
        return importLang(await import("@/translations/sw_KE.json"));
      case "th":
      case "th-TH":
        return importLang(await import("@/translations/th_TH.json"));
      case "zh":
      case "zh-CN":
        return importLang(await import("@/translations/zh_CN.json"));
      case "zh-TW":
        return importLang(await import("@/translations/zh_TW.json"));
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
