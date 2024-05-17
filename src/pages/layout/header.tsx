import { BorderButton, IconButton } from "@/element/buttons";
import { Icon } from "@/element/icon";
import { LoginSignup } from "@/element/login-signup";
import Logo from "@/element/logo";
import Modal from "@/element/modal";
import { AllLocales } from "@/intl";
import { Login } from "@/login";
import { profileLink } from "@/utils";
import { Menu, MenuItem } from "@szhsin/react-menu";
import { FormattedMessage } from "react-intl";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/lang";
import { useLogin } from "@/hooks/login";
import { useContext, useState } from "react";
import { Profile } from "@/element/profile";
import { SearchBar } from "./search";
import { NavLinkIcon } from "./nav-icon";
import { LayoutContext } from "./context";

export function HeaderNav() {
  const navigate = useNavigate();
  const login = useLogin();
  const [showLogin, setShowLogin] = useState(false);
  const { lang, setLang } = useLang();
  const country = lang.split(/[-_]/i)[1]?.toLowerCase();
  const layoutState = useContext(LayoutContext);

  function langSelector() {
    return (
      <Menu
        menuClassName="ctx-menu"
        menuButton={
          <div className="flex gap-2 items-center">
            {country && <div className={`fi fi-${country}`}></div>}
            <div className="uppercase pointer">
              <b>{lang.includes("-") ? lang.split("-")[0] : lang}</b>
            </div>
          </div>
        }
        align="end"
        gap={5}>
        {AllLocales.sort().map(l => (
          <MenuItem className="capitalize" onClick={() => setLang(l)} key={l}>
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
      <div className="flex gap-3 items-center pr-4 py-1">
        {(!import.meta.env.VITE_SINGLE_PUBLISHER || import.meta.env.VITE_SINGLE_PUBLISHER === login.pubkey) && (
          <>
            <Link to="/upload">
              <IconButton iconName="upload" iconSize={20} className="px-3 py-2 hover:bg-layer-1 rounded-xl" />
            </Link>
            <Link to="/dashboard">
              <IconButton iconName="signal" iconSize={20} className="px-3 py-2 hover:bg-layer-1 rounded-xl" />
            </Link>
          </>
        )}
        <Menu
          menuClassName="ctx-menu"
          menuButton={
            <div className="profile-menu">
              <Profile
                avatarSize={32}
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
          <MenuItem onClick={() => navigate(profileLink(undefined, login.pubkey))}>
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
      </div>
    );
  }

  function loggedOut() {
    if (login) return;
    return (
      <div className="pr-4">
        <BorderButton onClick={() => setShowLogin(true)}>
          <FormattedMessage defaultMessage="Login" id="AyGauy" />
          <Icon name="login" />
        </BorderButton>
        {showLogin && (
          <Modal
            id="login"
            onClose={() => setShowLogin(false)}
            bodyClassName="relative bg-layer-1 rounded-3xl overflow-hidden my-auto lg:w-[500px] max-lg:w-full"
            showClose={false}>
            <LoginSignup close={() => setShowLogin(false)} />
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center">
      <div className="flex gap-4 items-center m-2">
        <NavLinkIcon
          name="hamburger"
          className="!opacity-100 max-xl:hidden"
          onClick={() => {
            layoutState.update(c => {
              c.leftNav = !c.leftNav;
              return { ...c };
            });
          }}
        />
        <Link to="/">
          <Logo width={33} />
        </Link>
      </div>
      <SearchBar />
      <div className="flex items-center gap-3">
        <Link
          to="https://discord.gg/Wtg6NVDdbT"
          target="_blank"
          className="flex items-center max-md:hidden gap-1 bg-layer-1 hover:bg-layer-2 font-bold p-2 rounded-xl">
          <Icon name="link" />
          Discord
        </Link>
        {langSelector()}
        {loggedIn()}
        {loggedOut()}
      </div>
    </div>
  );
}
