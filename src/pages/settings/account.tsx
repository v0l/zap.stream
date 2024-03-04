import { StreamState } from "@/const";
import { Layer1Button } from "@/element/buttons";
import Copy from "@/element/copy";
import { StatePill } from "@/element/state-pill";
import { useLogin } from "@/hooks/login";
import { Login } from "@/login";
import { hexToBech32 } from "@snort/shared";
import { FormattedMessage } from "react-intl";

export default function AccountSettingsTab() {
  const login = useLogin();
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
