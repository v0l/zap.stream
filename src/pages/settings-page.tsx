import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { hexToBech32, unwrap } from "@snort/shared";

import { useLogin } from "@/hooks/login";
import Copy from "@/element/copy";
import { NostrProviderDialog } from "@/element/nostr-provider-dialog";
import { useStreamProvider } from "@/hooks/stream-provider";
import { Login } from "..";
import { StatePill } from "@/element/state-pill";
import { NostrStreamProvider } from "@/providers";
import { StreamState } from "@/const";
import { Layer1Button } from "@/element/buttons";

const enum Tab {
  Account,
  Stream,
}

export function SettingsPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [tab, setTab] = useState(Tab.Account);
  const providers = useStreamProvider();

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
              <FormattedMessage defaultMessage="Account" id="TwyMau" />
            </h1>
            {login?.pubkey && (
              <div className="public-key">
                <p>
                  <FormattedMessage defaultMessage="Logged in as" id="DZKuuP" />
                </p>
                <Copy text={hexToBech32("npub", login.pubkey)} />
              </div>
            )}
            {login?.privateKey && (
              <div className="private-key">
                <p>
                  <FormattedMessage defaultMessage="Private key" id="Bep/gA" />
                </p>
                <Layer1Button>
                  <FormattedMessage defaultMessage="Copy" id="4l6vz1" />
                </Layer1Button>
              </div>
            )}
            <h1>
              <FormattedMessage defaultMessage="Theme" id="Pe0ogR" />
            </h1>
            <div>
              <StatePill state={StreamState.Live} />
            </div>
            <div className="flex gap-2">
              {["#7F006A", "#E206BF", "#7406E2", "#3F06E2", "#393939", "#ff563f", "#ff8d2b", "#34d2fe"].map(a => (
                <div
                  className={`w-4 h-4 pointer${login?.color === a ? " border" : ""}`}
                  title={a}
                  style={{ backgroundColor: a }}
                  onClick={() => Login.setColor(a)}></div>
              ))}
            </div>
          </>
        );
      }
      case Tab.Stream: {
        return <>
          <h1>
            <FormattedMessage defaultMessage="Stream" id="uYw2LD" />
          </h1>
          <div className="flex flex-col gap-4">
            <NostrProviderDialog
              provider={unwrap(providers.find(a => a.name === "zap.stream")) as NostrStreamProvider}
              showEndpoints={true}
              showEditor={false}
              showForwards={true}
            />
          </div>
        </>
      }
    }
  }

  function tabName(t: Tab) {
    switch (t) {
      case Tab.Account:
        return <FormattedMessage defaultMessage="Account" id="TwyMau" />;
      case Tab.Stream:
        return <FormattedMessage defaultMessage="Stream" id="uYw2LD" />;
    }
  }

  return (
    <div className="rounded-2xl p-3 md:w-[700px] mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1>
          <FormattedMessage defaultMessage="Settings" id="D3idYv" />
        </h1>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {[Tab.Account, Tab.Stream].map(t => (
              <Layer1Button onClick={() => setTab(t)} className={t === tab ? "active" : ""}>
                {tabName(t)}
              </Layer1Button>
            ))}
          </div>
          <div className="p-5 bg-layer-1 rounded-3xl flex flex-col gap-3">{tabContent()}</div>
        </div>
      </div>
    </div>
  );
}
