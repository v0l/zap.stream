import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormattedMessage } from "react-intl";

import AsyncButton from "@/element/async-button";
import { StatePill } from "@/element/state-pill";
import { StreamState } from "@/index";
import { StreamProviderInfo, StreamProviderStore } from "@/providers";
import { Nip103StreamProvider } from "@/providers/zsz";

export function ConfigureNostrType() {
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<StreamProviderInfo>();
  const navigate = useNavigate();

  async function tryConnect() {
    try {
      const api = new Nip103StreamProvider(new URL(url).host, url);
      const inf = await api.info();
      setInfo(inf);
    } catch (e) {
      console.error(e);
    }
  }

  function status() {
    if (!info) return;

    return (
      <>
        <h3>Status</h3>
        <div>
          <StatePill state={info?.state ?? StreamState.Ended} />
        </div>
        <div>
          <p>Name</p>
          <div className="paper">{info?.name}</div>
        </div>
        {info?.summary && (
          <div>
            <p>Summary</p>
            <div className="paper">{info?.summary}</div>
          </div>
        )}
        {info?.viewers && (
          <div>
            <p>Viewers</p>
            <div className="paper">{info?.viewers}</div>
          </div>
        )}
        {info?.version && (
          <div>
            <p>Version</p>
            <div className="paper">{info?.version}</div>
          </div>
        )}
        <div>
          <button
            className="btn btn-border"
            onClick={() => {
              StreamProviderStore.add(new Nip103StreamProvider(new URL(url).host, url));
              navigate("/");
            }}>
            <FormattedMessage defaultMessage="Save" id="jvo0vs" />
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="owncast-config">
      <div className="flex flex-col gap-3">
        <div>
          <p>Nostr streaming provider URL</p>
          <div className="paper">
            <input type="text" placeholder="https://" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
        </div>
        <AsyncButton className="btn btn-primary" onClick={tryConnect}>
          <FormattedMessage defaultMessage="Connect" id="+vVZ/G" />
        </AsyncButton>
      </div>
      <div>{status()}</div>
    </div>
  );
}
