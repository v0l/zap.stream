import { useLogin } from "hooks/login";
import { useNavigate } from "react-router-dom";
import "./settings-page.css";
import React from "react";
import { Button } from "@getalby/bitcoin-connect-react";
import Copy from "element/copy";

export function SettingsPage() {
  const navigate = useNavigate();
  const login = useLogin();

  React.useEffect(() => {
    if (!login) {

      navigate("/");
    }
  }, [login])
  
  
  return (
    <div className="settings-page">
      <h1>Account</h1>
      {login?.pubkey && <div className="public-key">
        <p>Logged in as</p>
        <Copy text={login?.pubkey} maxSize={64} />
      </div>}
      {login?.privateKey && <div className="private-key">
        <p>Private key</p>
        <Copy text={login.privateKey} hideText />
      </div>}

      <h1>Zaps</h1>
      <Button/>
    </div>
  );
}
