import "./layout.css";

import { CSSProperties, useState, useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Outlet, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FormattedMessage } from "react-intl";
import { Menu, MenuItem } from "@szhsin/react-menu";
import { hexToBech32 } from "@snort/shared";

import { Icon } from "@/element/icon";
import { useLogin, useLoginEvents } from "@/hooks/login";
import { Profile } from "@/element/profile";
import { NewStreamDialog } from "@/element/new-stream";
import { LoginSignup } from "@/element/login-signup";
import { Login } from "@/index";
import { useLang } from "@/hooks/lang";
import { AllLocales } from "@/intl";
import { NewVersion } from "@/serviceWorker";
import AsyncButton from "@/element/async-button";

export function LayoutPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [showLogin, setShowLogin] = useState(false);
  const { lang, setLang } = useLang();

  useLoginEvents(login?.pubkey, true);

  function langSelector() {
    return (
      <Menu
        menuClassName="ctx-menu"
        menuButton={
          <div className="flex gap-2 items-center">
            <div className={`fi fi-${lang.split(/[-_]/i)[1]?.toLowerCase()}`}></div>
            <div className="uppercase pointer">
              <b>{lang.includes("-") ? lang.split("-")[0] : lang}</b>
            </div>
          </div>
        }
        align="end"
        gap={5}>
        {AllLocales.sort().map(l => (
          <MenuItem onClick={() => setLang(l)} key={l}>
            {new Intl.DisplayNames([l], {
              type: "language",
            }).of(l)}
          </MenuItem>
        ))}
      </Menu>
    );
  }

  function loggedIn() {
    if (!login) return;

    return (
      <>
        {(!__SINGLE_PUBLISHER || __SINGLE_PUBLISHER === login.pubkey) && (
          <NewStreamDialog btnClassName="btn btn-primary" />
        )}
        <Menu
          menuClassName="ctx-menu"
          menuButton={
            <div className="profile-menu">
              <Profile
                avatarClassname="mb-squared"
                pubkey={login.pubkey}
                options={{
                  showName: false,
                }}
                linkToProfile={false}
              />
            </div>
          }
          align="end"
          gap={5}>
          <MenuItem onClick={() => navigate(`/p/${hexToBech32("npub", login.pubkey)}`)}>
            <Icon name="user" size={24} />
            <FormattedMessage defaultMessage="Profile" id="itPgxd" />
          </MenuItem>
          <MenuItem onClick={() => navigate("/settings")}>
            <Icon name="settings" size={24} />
            <FormattedMessage defaultMessage="Settings" id="D3idYv" />
          </MenuItem>
          <MenuItem onClick={() => navigate("/widgets")}>
            <Icon name="widget" size={24} />
            <FormattedMessage defaultMessage="Widgets" id="jgOqxt" />
          </MenuItem>
          <MenuItem onClick={() => Login.logout()}>
            <Icon name="logout" size={24} />
            <FormattedMessage defaultMessage="Logout" id="C81/uG" />
          </MenuItem>
        </Menu>
      </>
    );
  }

  function loggedOut() {
    if (login) return;

    function handleLogin() {
      setShowLogin(true);
    }

    return (
      <Dialog.Root open={showLogin} onOpenChange={setShowLogin}>
        <button type="button" className="btn btn-border" onClick={handleLogin}>
          <FormattedMessage defaultMessage="Login" id="AyGauy" />
          <Icon name="login" />
        </button>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <LoginSignup close={() => setShowLogin(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  const styles = {} as CSSProperties;
  if (login?.color) {
    (styles as Record<string, string>)["--primary"] = login.color;
  }
  return (
    <div className={`page${location.pathname.startsWith("/naddr1") ? " stream" : ""}`} style={styles}>
      <Helmet>
        <title>Home - zap.stream</title>
      </Helmet>
      <header>
        <div
          className="bg-[#f1f0ff] flex items-center pointer rounded-2xl aspect-square px-1"
          onClick={() => navigate("/")}>
          <img src="/zap-stream.svg" width={40} />
        </div>
        <div className="grow">{/* Future menu items go here */}</div>
        <div className="flex items-center gap-3">
          {langSelector()}
          {loggedIn()}
          {loggedOut()}
        </div>
      </header>
      <Outlet />
      {NewVersion && <NewVersionBanner />}
    </div>
  );
}

function NewVersionBanner() {
  const newVersion = useSyncExternalStore(
    c => NewVersion.hook(c),
    () => NewVersion.snapshot()
  );
  if (!newVersion) return;

  return (
    <div className="fixed top-0 left-0 w-max flex bg-slate-800 py-2 px-4 opacity-95">
      <div className="grow">
        <h1>
          <FormattedMessage defaultMessage="A new version has been detected" id="RJ2VxG" />
        </h1>
        <p>
          <FormattedMessage defaultMessage="Refresh the page to use the latest version" id="Gmiwnd" />
        </p>
      </div>
      <AsyncButton onClick={() => window.location.reload()} className="btn">
        <FormattedMessage defaultMessage="Refresh" id="rELDbB" />
      </AsyncButton>
    </div>
  );
}
