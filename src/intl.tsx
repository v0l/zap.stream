import { DefaultLocale, useLang } from "hooks/lang";
import { useEffect, useState, type ReactNode } from "react";
import { IntlProvider as ReactIntlProvider } from "react-intl";

import enMessages from "translations/en.json";

async function importLang(code: string) {
  const src = await import(`translations/${code}.json`);
  const typed = src.default as Record<string, { defaultMessage: string }>;
  const ent = Object.entries(typed).map(([k, v]) => [k, v.defaultMessage]);
  return Object.fromEntries(ent) as Record<string, string>;
}

export const AllLocales = ["en", "de", "es", "th"];

const getMessages = (locale: string) => {
  const truncatedLocale = locale.toLowerCase().split(/[_-]+/)[0];

  const matchLang = async (lng: string) => {
    switch (lng) {
      case "de":
      case "de-DE":
        return await importLang("de_DE");
      case "es":
      case "es-ES":
        return await importLang("es_ES");
      case "th":
      case "th-TH":
        return await importLang("th_TH");
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
