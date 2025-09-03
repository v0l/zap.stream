import "./layout.css";

import { CSSProperties, useContext, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";

import { useLogin } from "@/hooks/login";
import { trackEvent } from "@/utils";
import { HeaderNav } from "./header";
import { LeftNav } from "./left-nav";
import { SnortContext } from "@snort/system-react";
import { EventKind } from "@snort/system";
import { USER_CARDS } from "@/const";

export function LayoutPage() {
  const location = useLocation();
  const login = useLogin();
  const system = useContext(SnortContext);

  useEffect(() => {
    if (login?.state) {
      login.state.checkIsStandardList(EventKind.EmojisList);
      login.state.checkIsStandardList(USER_CARDS);
      login.state.init(login.signer(), system);
      if (login.pubkey) {
        system.config.socialGraphInstance.setRoot(login.pubkey);
      }
    }
  }, [login]);

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
