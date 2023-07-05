import { Icon } from "element/icon";
import "./layout.css";
import {
  EventPublisher,
} from "@snort/system";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AsyncButton from "element/async-button";
import { Login } from "index";
import { useLogin } from "hooks/login";
import { Profile } from "element/profile";
import { NewStreamDialog } from "element/new-stream";

export function LayoutPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const location = useLocation();

  async function doLogin() {
    const pub = await EventPublisher.nip7();
    if (pub) {
      Login.loginWithPubkey(pub.pubKey);
    }
  }

  function loggedIn() {
    if (!login) return;

    return (
      <>
        <NewStreamDialog btnClassName="btn btn-primary" />
        <Profile
          avatarClassname="mb-squared"
          pubkey={login.pubkey}
          options={{
            showName: false,
          }}
        />
      </>
    );
  }

  function loggedOut() {
    if (login) return;

    return (
      <>
        <AsyncButton type="button" className="btn btn-border" onClick={doLogin}>
          Login
          <Icon name="login" />
        </AsyncButton>
      </>
    );
  }

  return (
    <div
      className={
        location.pathname === "/" || location.pathname.startsWith("/p/") || location.pathname.startsWith("/providers")
          ? "page only-content"
          : location.pathname.startsWith("/chat/")
          ? "page chat"
          : "page"
      }
    >
      <header>
        <div className="logo" onClick={() => navigate("/")}></div>
        <div className="paper">
          <input className="search-input" type="text" placeholder="Search" />
          <Icon name="search" size={15} />
        </div>
        <div className="header-right">
          {loggedIn()}
          {loggedOut()}
        </div>
      </header>
      <Outlet />
    </div>
  );
}
