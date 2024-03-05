import "./layout.css";

import { CSSProperties, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FormattedMessage, useIntl } from "react-intl";
import { Menu, MenuItem } from "@szhsin/react-menu";
import { hexToBech32 } from "@snort/shared";

import { Icon } from "@/element/icon";
import { useLogin, useLoginEvents } from "@/hooks/login";
import { Profile } from "@/element/profile";
import { NewStreamDialog } from "@/element/new-stream";
import { LoginSignup } from "@/element/login-signup";
import { Login } from "@/login";
import { useLang } from "@/hooks/lang";
import { AllLocales } from "@/intl";
import { trackEvent } from "@/utils";
import { BorderButton } from "@/element/buttons";
import Modal from "@/element/modal";
import Logo from "@/element/logo";

export function LayoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const [showLogin, setShowLogin] = useState(false);
  const { lang, setLang } = useLang();

  useLoginEvents(login?.pubkey, true);

  useEffect(() => {
    trackEvent("pageview");
  }, [location]);

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
        {(!import.meta.env.VITE_SINGLE_PUBLISHER || import.meta.env.VITE_SINGLE_PUBLISHER === login.pubkey) && (
          <NewStreamDialog btnClassName="btn btn-primary" />
        )}
        <Menu
          menuClassName="ctx-menu"
          menuButton={
            <div className="profile-menu">
              <Profile
                avatarSize={48}
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
          <MenuItem onClick={() => navigate("/dashboard")}>
            <Icon name="line-chart-up" size={24} />
            <FormattedMessage defaultMessage="Dashboard" id="hzSNj4" />
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
    return (
      <>
        <BorderButton onClick={() => setShowLogin(true)}>
          <FormattedMessage defaultMessage="Login" id="AyGauy" />
          <Icon name="login" />
        </BorderButton>
        {showLogin && (
          <Modal
            id="login"
            onClose={() => setShowLogin(false)}
            bodyClassName="my-auto bg-layer-1 rounded-xl overflow-hidden">
            <div className="w-full">
              <LoginSignup close={() => setShowLogin(false)} />
            </div>
          </Modal>
        )}
      </>
    );
  }

  const styles = {} as CSSProperties;
  if (login?.color) {
    (styles as Record<string, string>)["--primary"] = login.color;
  }
  return (
    <div className="pt-4 px-2 xl:px-5 h-[calc(100dvh-1rem)]" style={styles}>
      <Helmet>
        <title>Home - zap.stream</title>
      </Helmet>
      <div className="flex justify-between mb-4">
        <div className="flex gap-6 items-center">
          <div
            className="bg-white text-black flex items-center cursor-pointer rounded-2xl aspect-square px-1"
            onClick={() => navigate("/")}>
            <Logo width={40} height={40} />
          </div>
          <SearchBar />
          <Link to="/category" className="max-xl:hidden">
            <FormattedMessage defaultMessage="Categories" id="VKb1MS" />
          </Link>
          <Link to="/faq" className="max-xl:hidden">
            <FormattedMessage defaultMessage="FAQ" id="W8nHSd" />
          </Link>
        </div>
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
      <Outlet />
    </div>
  );
}

function SearchBar() {
  const { term } = useParams();
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const [search, setSearch] = useState(term ?? "");

  return (
    <div className="max-xl:bg-white xl:bg-layer-2 rounded-xl pr-4 py-1 flex items-center">
      <input
        type="text"
        className="max-xl:hidden"
        placeholder={formatMessage({
          defaultMessage: "Search",
          id: "xmcVZ0",
        })}
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            navigate(`/search/${encodeURIComponent(search)}`);
          }
        }}
      />
      <Icon
        name="search"
        className="max-xl:text-black mx:text-layer-4 max-xl:ml-4 max-xl:my-1"
        size={16}
        onClick={() => {
          navigate("/search");
        }}
      />
    </div>
  );
}
