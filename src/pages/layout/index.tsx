import "./layout.css";

import { CSSProperties, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";

import { useLogin, useLoginEvents } from "@/hooks/login";
import { trackEvent } from "@/utils";
import { HeaderNav } from "./header";
import { LeftNav } from "./left-nav";

export function LayoutPage() {
  const location = useLocation();
  const login = useLogin();

  useLoginEvents(login?.pubkey, true);

  useEffect(() => {
    trackEvent("pageview");
  }, [location]);

  const styles = {} as CSSProperties;
  if (login?.color) {
    (styles as Record<string, string>)["--primary"] = login.color;
  }
  return (
    <div style={styles}>
      <Helmet>
        <title>Home - zap.stream</title>
      </Helmet>

      <HeaderNav />
      <div className="flex">
        <LeftNav />
        <Outlet />
      </div>
    </div>
  );
}
