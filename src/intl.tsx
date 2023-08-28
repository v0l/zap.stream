import { useEffect, useState, type ReactNode } from "react";
import { IntlProvider as ReactIntlProvider } from "react-intl";

import enMessages from "translations/en.json";

const DefaultLocale = "en-US";

const getMessages = (locale: string) => {
  const truncatedLocale = locale.toLowerCase().split(/[_-]+/)[0];

  const matchLang = (lng: string) => {
    switch (lng) {
      case DefaultLocale:
      case "en":
        return enMessages;
    }
  };

  return matchLang(locale) ?? matchLang(truncatedLocale) ?? enMessages;
};

export const IntlProvider = ({ children }: { children: ReactNode }) => {
  const locale = getLocale();
  const [messages, setMessages] = useState<Record<string, string>>(enMessages);

  useEffect(() => {
    const msg = getMessages(locale);
    setMessages(msg);
  }, [locale]);

  return (
    <ReactIntlProvider locale={locale} messages={messages}>
      {children}
    </ReactIntlProvider>
  );
};

export const getLocale = () => {
  return (navigator.languages && navigator.languages[0]) ?? navigator.language ?? DefaultLocale;
};
