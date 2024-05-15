import { StreamState } from "@/const";
import { Layer1Button, PrimaryButton, WarningButton } from "@/element/buttons";
import Copy from "@/element/copy";
import { StatePill } from "@/element/state-pill";
import { useLogin } from "@/hooks/login";
import { useWallet } from "@/hooks/wallet";
import { Login } from "@/login";
import { formatSats } from "@/number";
import { hexToBech32 } from "@snort/shared";
import { NostrConnectWallet, WalletKind } from "@snort/wallet";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";

export default function AccountSettingsTab() {
  const login = useLogin();
  const [wallet, setWallet] = useState("");
  const [error, setError] = useState("");

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
            <FormattedMessage defaultMessage="Private key" />
          </p>
          <Layer1Button>
            <FormattedMessage defaultMessage="Copy" />
          </Layer1Button>
        </div>
      )}
      <h1>
        <FormattedMessage defaultMessage="Theme" />
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
      <h1>
        <FormattedMessage defaultMessage="Wallet" />
      </h1>
      {login?.wallet && (
        <div className="flex justify-between">
          <WalletBalance />
          <WarningButton
            onClick={() => {
              login.update(s => (s.wallet = undefined));
            }}>
            <FormattedMessage defaultMessage="Remove" />
          </WarningButton>
        </div>
      )}
      {!login?.wallet && (
        <div className="flex flex-col gap-2">
          <p>
            <FormattedMessage defaultMessage="Connect Wallet" />
          </p>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="nostr+walletconnect://"
              value={wallet}
              onChange={e => setWallet(e.target.value)}
            />
            <PrimaryButton
              onClick={async () => {
                try {
                  setError("");
                  const w = new NostrConnectWallet(wallet);
                  await w.login();
                  await w.getInfo();
                  login?.update(s => {
                    s.wallet = {
                      type: WalletKind.NWC,
                      data: wallet,
                    };
                  });
                  setWallet("");
                } catch (e) {
                  if (e instanceof Error) {
                    setError(e.message);
                  }
                }
              }}>
              <FormattedMessage defaultMessage="Connect" />
            </PrimaryButton>
          </div>
          {error && <b className="text-warning">{error}</b>}
        </div>
      )}
    </>
  );
}

function WalletBalance() {
  const wallet = useWallet();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    setBalance(0);
    if (wallet) {
      wallet.getBalance().then(setBalance);
    }
  }, [wallet]);

  return (
    <FormattedMessage
      defaultMessage="Balance: {n} sats"
      values={{
        n: formatSats(balance),
      }}
    />
  );
}
