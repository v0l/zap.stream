import "./layout.css";

import { type CSSProperties, useContext, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { Helmet } from "@dr.pogodin/react-helmet";

import { useLogin } from "@/hooks/login";
import { trackEvent } from "@/utils";
import { HeaderNav } from "./header";
import { LeftNav } from "./left-nav";
import { SnortContext, TraceTimelineOverlay } from "@snort/system-react";
import { EventKind } from "@snort/system";
import { USER_CARDS } from "@/const";

export function LayoutPage() {
  const location = useLocation();
  const login = useLogin();
  const system = useContext(SnortContext);
  const [trace, setTrace] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const target = e.target;
      const skipTarget = ["INPUT", "TEXTAREA"];
      if (skipTarget.includes((target as HTMLElement)?.nodeName)) {
        return;
      }
      if (e.key === "t") {
        setTrace(t => !t);
      }
    };
    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("keydown", h);
    };
  }, []);

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
      <TraceTimelineOverlay isOpen={trace} onClose={() => setTrace(false)} />
    </div>
  );
}
