import "./settings-page.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { Button as AlbyZapsButton } from "@getalby/bitcoin-connect-react";
import { hexToBech32 } from "@snort/shared";

import { useLogin } from "hooks/login";
import Copy from "element/copy";

const enum Tab {
  Account,
  Notifications
}

export function SettingsPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [tab, setTab] = useState(Tab.Account);

  useEffect(() => {
    if (!login) {
      navigate("/");
    }
  }, [login]);

  function tabContent() {
    switch (tab) {
      case Tab.Account: {
        return (
          <>
            <h1>
              <FormattedMessage defaultMessage="Account" />
            </h1>
            {login?.pubkey && (
              <div className="public-key">
                <p>
                  <FormattedMessage defaultMessage="Logged in as" />
                </p>
                <Copy text={hexToBech32("npub", login.pubkey)} />
              </div>
            )}
            {login?.privateKey && (
              <div className="private-key">
                <p>
                  <FormattedMessage defaultMessage="Private key" />
                </p>
                <Copy text={hexToBech32("nsec", login.privateKey)} />
              </div>
            )}
            <h1>
              <FormattedMessage defaultMessage="Zaps" />
            </h1>
            <AlbyZapsButton />
          </>
        )
      }
    }
  }
  return (
    <div className="settings-page">
      <div className="flex f-col g48">
        <h1>
          <FormattedMessage defaultMessage="Settings" />
        </h1>
        <div className="flex g24 f-col-mobile">
          <div className="flex f-col g24 tab-options">
            <div onClick={() => setTab(Tab.Account)}>
              <FormattedMessage defaultMessage="Account" />
            </div>
          </div>
          <div className="tab-content">
            {tabContent()}
          </div>
        </div>
      </div>

    </div>
  );
}
