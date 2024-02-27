import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { StatePill } from "@/element/state-pill";
import { StreamProviderInfo, StreamProviderStore } from "@/providers";
import { OwncastProvider } from "@/providers/owncast";
import { StreamState } from "@/const";
import { DefaultButton } from "@/element/buttons";

export function ConfigureOwncast() {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [info, setInfo] = useState<StreamProviderInfo>();
  const navigate = useNavigate();

  async function tryConnect() {
    try {
      const api = new OwncastProvider(url, token);
      const i = await api.info();
      setInfo(i);
    } catch (e) {
      console.debug(e);
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
          <DefaultButton
            onClick={() => {
              StreamProviderStore.add(new OwncastProvider(url, token));
              navigate("/");
            }}>
            Save
          </DefaultButton>
        </div>
      </>
    );
  }

  return (
    <div className="owncast-config">
      <div className="flex flex-col gap-3">
        <div>
          <p>Owncast instance url</p>
          <div className="paper">
            <input type="text" placeholder="https://" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
        </div>
        <div>
          <p>API token</p>
          <div className="paper">
            <input type="password" value={token} onChange={e => setToken(e.target.value)} />
          </div>
        </div>
        <DefaultButton onClick={tryConnect}>
          Connect
        </DefaultButton>
      </div>
      <div>{status()}</div>
    </div>
  );
}
