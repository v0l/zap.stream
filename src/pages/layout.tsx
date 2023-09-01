import "./layout.css";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Outlet, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FormattedMessage } from "react-intl";
import { Menu, MenuItem } from "@szhsin/react-menu";
import { hexToBech32 } from "@snort/shared";

import { Icon } from "element/icon";
import { useLogin, useLoginEvents } from "hooks/login";
import { Profile } from "element/profile";
import { NewStreamDialog } from "element/new-stream";
import { LoginSignup } from "element/login-signup";
import { Login } from "index";
import { useLang } from "hooks/lang";
import { AllLocales } from "intl";

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
          <div className="flex f-center g24">
            <div className="flag">

            </div>
            <div className="uppercase pointer">
              <b>{lang.includes("-") ? lang.split("-")[0] : lang}</b>
            </div>
          </div>
        }
        align="end"
        gap={5}>
        {AllLocales.sort().map(l => <MenuItem onClick={() => setLang(l)} key={l}>
          {new Intl.DisplayNames([l], {
            type: "language",
          }).of(l)}
        </MenuItem>)}

      </Menu>
    );
  }

  function loggedIn() {
    if (!login) return;

    return (
      <>
        <NewStreamDialog btnClassName="btn btn-primary" />
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
            <FormattedMessage defaultMessage="Profile" />
          </MenuItem>
          <MenuItem onClick={() => navigate("/settings")}>
            <Icon name="settings" size={24} />
            Settings
          </MenuItem>
          <MenuItem onClick={() => Login.logout()}>
            <Icon name="logout" size={24} />
            <FormattedMessage defaultMessage="Logout" />
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
          <FormattedMessage defaultMessage="Login" />
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

  return (
    <div className={`page${location.pathname.startsWith("/naddr1") ? " stream" : ""}`}>
      <Helmet>
        <title>Home - zap.stream</title>
      </Helmet>
      <header>
        <div className="logo" onClick={() => navigate("/")}></div>
        {/*<div className="paper">
          <input className="search-input" type="text" placeholder="Search" />
          <Icon name="search" size={15} />
  </div>*/}
        <div className="f-grow">{/* Future menu items go here */}</div>
        <div className="header-right">
          {langSelector()}
          {loggedIn()}
          {loggedOut()}
        </div>
      </header>
      <Outlet />
    </div>
  );
}
