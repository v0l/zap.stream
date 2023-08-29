import "./login-signup.css";
import { CSSProperties, useState } from "react";
import { EventPublisher, UserMetadata } from "@snort/system";
import { schnorr } from "@noble/curves/secp256k1";
import { bytesToHex } from "@noble/curves/abstract/utils";

import AsyncButton from "./async-button";
import { Login, System } from "index";
import { Icon } from "./icon";
import Copy from "./copy";
import { hexToBech32, openFile } from "utils";
import { VoidApi } from "@void-cat/api";
import { FormattedMessage } from "react-intl";
import { bech32 } from "@scure/base";

enum Stage {
  Login = 0,
  Details = 1,
  SaveKey = 2,
}

export function LoginSignup({ close }: { close: () => void }) {
  const [error, setError] = useState("");
  const [stage, setStage] = useState(Stage.Login);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [key, setNewKey] = useState("");

  function doLoginNsec() {
    try {
      let nsec = prompt("Enter your nsec\nWARNING: THIS IS NOT RECOMMENDED. DO NOT IMPORT ANY KEYS YOU CARE ABOUT");
      if (!nsec) {
        throw new Error("no nsec provided");
      }
      if (nsec.startsWith("nsec")) {
        const {words} = bech32.decode(nsec, 5000);
        const data = new Uint8Array(bech32.fromWords(words));
        nsec = bytesToHex(data);
      }
      Login.loginWithPrivateKey(nsec);
      close();
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(e as string);
      }
    }
  }

  function createAccount() {
    const newKey = bytesToHex(schnorr.utils.randomPrivateKey());
    setNewKey(newKey);
    setStage(Stage.Details);
  }

  function loginWithKey() {
    Login.loginWithPrivateKey(key);
    close();
  }

  async function uploadAvatar() {
    const file = await openFile();
    if (file) {
      const VoidCatHost = "https://void.cat";
      const api = new VoidApi(VoidCatHost);
      const uploader = api.getUploader(file);
      const result = await uploader.upload({
        "V-Strip-Metadata": "true",
      });
      if (result.ok) {
        const resultUrl = result.file?.metadata?.url ?? `${VoidCatHost}/d/${result.file?.id}`;
        setAvatar(resultUrl);
      } else {
        setError(result.errorMessage ?? "Upload failed");
      }
    }
  }

  async function saveProfile() {
    const pub = EventPublisher.privateKey(key);
    const profile = {
      name: username,
      picture: avatar,
      lud16: `${pub.pubKey}@zap.stream`,
    } as UserMetadata;

    const ev = await pub.metadata(profile);
    console.debug(ev);
    System.BroadcastEvent(ev);

    setStage(Stage.SaveKey);
  }

  switch (stage) {
    case Stage.Login: {
      return (
        <>
          <h2>
            <FormattedMessage defaultMessage="Create an Account" />
          </h2>
          <h3>
            <FormattedMessage defaultMessage="No emails, just awesomeness!" />
          </h3>
          <button type="button" className="btn btn-primary btn-block" onClick={createAccount}>
            <FormattedMessage defaultMessage="Create Account" />
          </button>
          <div className="or-divider">
            <hr/>
            <FormattedMessage defaultMessage="OR" />
            <hr/>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={doLoginNsec}
          >
            <FormattedMessage defaultMessage="Login with Private Key (insecure)" />
          </button>
          {error && <b className="error">{error}</b>}
        </>
      );
    }
    case Stage.Details: {
      return (
        <>
          <h2>
            <FormattedMessage defaultMessage="Setup Profile" />
          </h2>
          <div className="flex f-center">
            <div
              className="avatar-input"
              onClick={uploadAvatar}
              style={
                {
                  "--img": `url(${avatar})`,
                } as CSSProperties
              }>
              <Icon name="camera-plus" />
            </div>
          </div>
          <div className="username">
            <div className="paper">
              <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <small>
              <FormattedMessage defaultMessage="You can change this later" />
            </small>
          </div>
          <AsyncButton type="button" className="btn btn-primary" onClick={saveProfile}>
            <FormattedMessage defaultMessage="Save" />
          </AsyncButton>
        </>
      );
    }
    case Stage.SaveKey: {
      return (
        <>
          <h2>
            <FormattedMessage defaultMessage="Save Key" />
          </h2>
          <p>
            <FormattedMessage defaultMessage="Nostr uses private keys, please save yours, if you lose this key you wont be able to login to your account anymore!" />
          </p>
          <div className="paper">
            <Copy text={hexToBech32("nsec", key)} />
          </div>
          <button type="button" className="btn btn-primary" onClick={loginWithKey}>
            <FormattedMessage defaultMessage="Ok, it's safe" />
          </button>
        </>
      );
    }
  }
}
