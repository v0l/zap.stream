import { Icon } from "element/icon";
import "./layout.css";
import { EventPublisher, NostrEvent } from "@snort/system";
import { nip19 } from "nostr-tools";
import { Outlet, useNavigate } from "react-router-dom";
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
          New Stream
          <Icon name="signal" />
        </button>
        <Profile
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
    const addr = {
      pubkey: ev.pubkey,
      kind: ev.kind,
      identifier: ev.tags.find(t => t.at(0) === "d")?.at(1) || "",
    }
    const naddr = nip19.naddrEncode(addr)
    navigate(`/live/${naddr}`);
    setNewStream(false)
  }

  return (
    <>
      <header>
        <div onClick={() => navigate("/")}>S</div>
        <div className="input">
          <input type="text" placeholder="Search" />
          <Icon name="search" size={15} />
        </div>
        <div>
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
    </>
  );
}
