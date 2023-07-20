import "./layout.css";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Helmet } from "react-helmet";

import { Icon } from "element/icon";
import { useLogin } from "hooks/login";
import { Profile } from "element/profile";
import { NewStreamDialog } from "element/new-stream";
import { LoginSignup } from "element/login-signup";
import { Menu, MenuItem } from "@szhsin/react-menu";
import { hexToBech32 } from "@snort/shared";
import { Login } from "index";

export function LayoutPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);

  function loggedIn() {
    if (!login) return;

    return (
      <>
        <NewStreamDialog btnClassName="btn btn-primary" />
        <Menu
          menuClassName="ctx-menu"
          menuButton={
            <div>
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
          gap={5}
        >
          <MenuItem
            onClick={() => navigate(`/p/${hexToBech32("npub", login.pubkey)}`)}
          >
            <Icon name="user" size={24} />
            Profile
          </MenuItem>
          <MenuItem onClick={() => Login.logout()}>
            <Icon name="logout" size={24} />
            Logout
          </MenuItem>
        </Menu>
      </>
    );
  }

  function loggedOut() {
    if (login) return;

    return (
      <Dialog.Root open={showLogin} onOpenChange={setShowLogin}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="btn btn-border"
            onClick={() => setShowLogin(true)}
          >
            Login
            <Icon name="login" />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <LoginSignup close={() => setShowLogin(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }
  const isNsfw = window.location.pathname === "/nsfw";

  return (
    <div
      className={
        location.pathname === "/" ||
        location.pathname.startsWith("/p/") ||
        location.pathname.startsWith("/providers") ||
        location.pathname === "/nsfw"
          ? "page only-content"
          : location.pathname.startsWith("/chat/")
          ? "page chat"
          : "page"
      }
    >
      <Helmet>
        <title>Home - zap.stream</title>
      </Helmet>
      <header>
        <div className="logo" onClick={() => navigate("/")}></div>
        <div className="paper">
          <input className="search-input" type="text" placeholder="Search" />
          <Icon name="search" size={15} />
        </div>
        <Link to={"/nsfw"}>
          <div className={`btn-header${isNsfw ? " active" : ""}`}>
            Adult (18+)
          </div>
        </Link>

        <div className="header-right">
          {loggedIn()}
          {loggedOut()}
        </div>
      </header>
      <Outlet />
      {isNsfw && <ContentWarningOverlay />}
    </div>
  );
}

function ContentWarningOverlay() {
  const navigate = useNavigate();
  const [is18Plus, setIs18Plus] = useState(
    Boolean(window.localStorage.getItem("accepted-content-warning"))
  );
  if (is18Plus) return null;

  function grownUp() {
    window.localStorage.setItem("accepted-content-warning", "true");
    setIs18Plus(true);
  }

  return (
    <div className="fullscreen-exclusive age-check">
      <h1>Sexually explicit material ahead!</h1>
      <h2>Confirm your age</h2>
      <div className="flex g24">
        <button className="btn btn-warning" onClick={grownUp}>
          Yes, I am over 18
        </button>
        <button className="btn" onClick={() => navigate("/")}>
          No, I am under 18
        </button>
      </div>
    </div>
  );
}
