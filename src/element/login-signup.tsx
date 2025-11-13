import LoginHeader from "../login-start.jpg";
import LoginHeader2x from "../login-start@2x.jpg";
import LoginVault from "../login-vault.jpg";
import LoginVault2x from "../login-vault@2x.jpg";
import LoginProfile from "../login-profile.jpg";
import LoginProfile2x from "../login-profile@2x.jpg";
import LoginKey from "../login-key.jpg";
import LoginKey2x from "../login-key@2x.jpg";
import LoginWallet from "../login-wallet.jpg";
import LoginWallet2x from "../login-wallet@2x.jpg";

import { useContext, useState } from "react";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { EventPublisher, PrivateKeySigner, UserMetadata } from "@snort/system";
import { LNURL, bech32ToHex, getPublicKey, hexToBech32, isHex } from "@snort/shared";
import { SnortContext } from "@snort/system-react";

import { Login, LoginType } from "@/login";
import { Icon } from "./icon";
import Copy from "./copy";
import { AccountResponse, NostrStreamProvider } from "@/providers/zsz";
import { DefaultButton, Layer1Button } from "./buttons";
import { ExternalLink } from "./external-link";
import { FileUploader } from "./file-uploader";
import { Link } from "react-router-dom";
import { useStreamProvider } from "@/hooks/stream-provider";

enum Stage {
  Login = 0,
  LoginInput = 1,
  Details = 2,
  LnAddress = 3,
  SaveKey = 4,
}

export function LoginSignup({ close }: { close: () => void }) {
  const system = useContext(SnortContext);
  const [error, setError] = useState("");
  const [stage, setStage] = useState(Stage.Login);
  const [username, setUsername] = useState("");
  const [lnAddress, setLnAddress] = useState("");
  const [providerInfo, setProviderInfo] = useState<AccountResponse>();
  const [avatar, setAvatar] = useState("");
  const [key, setNewKey] = useState("");
  const { formatMessage } = useIntl();
  const hasNostrExtension = "nostr" in window && window.nostr;
  const { config } = useStreamProvider();

  function doLoginNsec() {
    try {
      const hexKey = key.startsWith("nsec") ? bech32ToHex(key) : key;
      Login.loginWithPrivateKey(hexKey);
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

  async function loginNip7() {
    try {
      const nip7 = await EventPublisher.nip7();
      if (nip7) {
        Login.loginWithPubkey(nip7.pubKey, LoginType.Nip7);
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(e as string);
      }
    }
  }

  function createAccount() {
    const signer = PrivateKeySigner.random();
    setNewKey(signer.privateKey);
    setLnAddress(`${getPublicKey(signer.getPubKey())}@${window.location.host}`);
    setStage(Stage.Details);
  }

  function loginWithKey() {
    Login.loginWithPrivateKey(key);
    close();
  }

  async function setupProfile() {
    const px = new NostrStreamProvider(config.name, config.url, EventPublisher.privateKey(key));
    const info = await px.info();
    setProviderInfo(info);

    setStage(Stage.LnAddress);
  }

  async function saveProfile() {
    try {
      // validate LN addreess
      try {
        const lnurl = new LNURL(lnAddress);
        await lnurl.load();
      } catch {
        if (!lnAddress.includes("localhost") && import.meta.env.DEV) {
          throw new Error(
            formatMessage({
              defaultMessage: "Hmm, your lightning address looks wrong",
              id: "4l69eO",
            }),
          );
        }
      }
      const pub = EventPublisher.privateKey(key);
      const profile = {
        name: username,
        picture: avatar,
        lud16: lnAddress,
      } as UserMetadata;

      const ev = await pub.metadata(profile);
      console.debug(ev);
      system.BroadcastEvent(ev);

      setStage(Stage.SaveKey);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(e as string);
      }
    }
  }

  function imageUploadSection() {
    const signer = key && key.length === 64 && isHex(key) ? new PrivateKeySigner(key) : undefined;
    if (!signer) return;
    return (
      <FileUploader
        publisher={new EventPublisher(signer, signer.getPubKey())}
        onResult={e => setAvatar(e ?? "")}
        onError={e => setError(e.toString())}
        className="absolute flex items-center justify-center w-full h-full hover:opacity-30 opacity-0 transition bg-black cursor-pointer">
        <Icon name="camera-plus" />
      </FileUploader>
    );
  }

  switch (stage) {
    case Stage.Login: {
      return (
        <>
          <img src={LoginHeader as string} srcSet={`${LoginHeader2x} 2x`} className="w-full" />
          <div className="flex flex-col gap-2 m-4">
            <h2>
              <FormattedMessage defaultMessage="Create an Account" id="u6uD94" />
            </h2>
            <FormattedMessage defaultMessage="No emails, just awesomeness!" id="+AcVD+" />
            <DefaultButton onClick={createAccount}>
              <FormattedMessage defaultMessage="Create Account" id="5JcXdV" />
            </DefaultButton>

            <div className="border-t border-b my-4 py-2 border-layer-3 text-center">
              <FormattedMessage defaultMessage="OR" id="INlWvJ" />
            </div>
            <div>
              <DefaultButton onClick={loginNip7} className="w-full">
                <FormattedMessage defaultMessage="Nostr Extension" id="ebmhes" />
              </DefaultButton>
              {!hasNostrExtension && (
                <>
                  <small className="cursor-pointer">
                    <FormattedMessage
                      defaultMessage="Dont have a nostr extension? Try {nos2x}, {nostore} or {alby}"
                      values={{
                        nos2x: (
                          <Link
                            className="underline"
                            target="_blank"
                            to="https://chrome.google.com/webstore/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp">
                            Nos2X
                          </Link>
                        ),
                        nostore: (
                          <Link className="underline" target="_blank" to="">
                            Nostore
                          </Link>
                        ),
                        alby: (
                          <Link className="underline" target="_blank" to="">
                            Alby
                          </Link>
                        ),
                      }}
                    />
                  </small>
                </>
              )}
            </div>
            <DefaultButton onClick={() => setStage(Stage.LoginInput)}>
              <FormattedMessage defaultMessage="Login with Private Key (insecure)" id="feZ/kG" />
            </DefaultButton>
            {error && <b className="error">{error}</b>}
          </div>
        </>
      );
    }
    case Stage.LoginInput: {
      return (
        <>
          <img src={LoginVault as string} srcSet={`${LoginVault2x} 2x`} className="w-full" />
          <div className="flex flex-col gap-2 m-4">
            <h2>
              <FormattedMessage defaultMessage="Login with private key" />
            </h2>
            <p>
              <FormattedMessage
                defaultMessage="This method is insecure. We recommend using a {nostrlink}"
                values={{
                  nostrlink: (
                    <ExternalLink href="">
                      <FormattedMessage defaultMessage="nostr signer extension" />
                    </ExternalLink>
                  ),
                }}
              />
            </p>
            <input
              type="text"
              value={key}
              onChange={e => setNewKey(e.target.value)}
              placeholder={formatMessage({ defaultMessage: "eg. nsec1xyz" })}
            />
            <div className="flex justify-between">
              <div></div>
              <div className="flex gap-1">
                <Layer1Button
                  onClick={() => {
                    setNewKey("");
                    setStage(Stage.Login);
                  }}>
                  <FormattedMessage defaultMessage="Cancel" id="47FYwb" />
                </Layer1Button>
                <DefaultButton onClick={doLoginNsec}>
                  <FormattedMessage defaultMessage="Log In" id="r2Jjms" />
                </DefaultButton>
              </div>
            </div>
            {error && <b className="error">{error}</b>}
          </div>
        </>
      );
    }
    case Stage.Details: {
      return (
        <>
          <img src={LoginProfile as string} srcSet={`${LoginProfile2x} 2x`} className="w-full" />
          <div className="flex flex-col gap-2 m-4">
            <h2>
              <FormattedMessage defaultMessage="Setup Profile" />
            </h2>
            <div className="relative mx-auto w-[100px] h-[100px] rounded-full overflow-hidden bg-layer-3">
              {avatar && <img className="absolute object-fit w-full h-full" src={avatar} />}
              {imageUploadSection()}
            </div>
            <input
              type="text"
              placeholder={formatMessage({
                defaultMessage: "Username",
              })}
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <small className="text-neutral-300">
              <FormattedMessage defaultMessage="You can change this later" />
            </small>
            <DefaultButton onClick={setupProfile}>
              <FormattedMessage defaultMessage="Save" />
            </DefaultButton>
            {error && <b className="error">{error}</b>}
          </div>
        </>
      );
    }
    case Stage.LnAddress: {
      return (
        <>
          <img src={LoginWallet as string} srcSet={`${LoginWallet2x} 2x`} className="w-full" />
          <div className="flex flex-col gap-2 m-4">
            <h2>
              <FormattedMessage defaultMessage="Get paid by viewers" />
            </h2>
            <p>
              <FormattedMessage defaultMessage="We hooked you up with a lightning wallet so you can get paid by viewers right away!" />
            </p>
            {providerInfo?.balance && (
              <p>
                <FormattedMessage
                  defaultMessage="Oh, and you have {n} sats of free streaming on us! 💜"
                  values={{
                    n: <FormattedNumber value={providerInfo.balance} />,
                  }}
                />
              </p>
            )}
            <input
              type="text"
              placeholder={formatMessage({ defaultMessage: "eg. name@wallet.com" })}
              value={lnAddress}
              onChange={e => setLnAddress(e.target.value)}
            />
            <small>
              <FormattedMessage defaultMessage="You can always replace it with your own address later." />
            </small>
            {error && <b className="error">{error}</b>}
            <DefaultButton onClick={saveProfile}>
              <FormattedMessage defaultMessage="Amazing! Continue.." />
            </DefaultButton>
          </div>
        </>
      );
    }
    case Stage.SaveKey: {
      return (
        <>
          <img src={LoginKey as string} srcSet={`${LoginKey2x} 2x`} className="w-full" />
          <div className="flex flex-col gap-2 m-4">
            <h2>
              <FormattedMessage defaultMessage="Save Key" id="04lmFi" />
            </h2>
            <p>
              <FormattedMessage
                defaultMessage="Save this and keep it safe! If you lose this key, you won't be able to access your account ever again. Yep, it's that serious!"
                id="H/bNs9"
              />
            </p>
            <div className="bg-layer-1 rounded-xl px-3 py-2">
              <Copy text={hexToBech32("nsec", key)} />
            </div>
            <DefaultButton onClick={loginWithKey}>
              <FormattedMessage defaultMessage="Ok, it's safe" id="My6HwN" />
            </DefaultButton>
          </div>
        </>
      );
    }
  }
}
