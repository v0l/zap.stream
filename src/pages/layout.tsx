import { Icon } from "element/icon";
import "./layout.css";
import {
  EventPublisher,
  NostrEvent,
  encodeTLV,
  NostrPrefix,
} from "@snort/system";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AsyncButton from "element/async-button";
import { Login } from "index";
import { useLogin } from "hooks/login";
import { Profile } from "element/profile";
import Modal from "element/modal";
import { NewStream } from "element/new-stream";
import { useState } from "react";

export function LayoutPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [newStream, setNewStream] = useState(false);
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
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setNewStream(true)}
        >
          <span className="new-stream-button-text">New Stream</span>
          <Icon name="signal" />
        </button>
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

  function goToStream(ev: NostrEvent) {
    const d = ev.tags.find((t) => t.at(0) === "d")?.at(1) || "";
    const naddr = encodeTLV(
      NostrPrefix.Address,
      d,
      undefined,
      ev.kind,
      ev.pubkey
    );
    navigate(`/live/${naddr}`);
    setNewStream(false);
  }

  return (
    <div
      className={location.pathname.startsWith("/live/") ? "page" : "page home"}
    >
      <header>
        <div className="logo" onClick={() => navigate("/")}>
          S
        </div>
        <div className="input">
          <input className="search-input" type="text" placeholder="Search" />
          <Icon name="search" size={15} />
        </div>
        <div className="header-right">
          {loggedIn()}
          {loggedOut()}
        </div>
      </header>
      <Outlet />
      {newStream && (
        <Modal onClose={() => setNewStream(false)}>
          <NewStream onFinish={goToStream} />
        </Modal>
      )}
    </div>
  );
}
