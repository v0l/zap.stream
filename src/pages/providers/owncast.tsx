import AsyncButton from "element/async-button";
import { StatePill } from "element/state-pill";
import { StreamState } from "index";
import { StreamProviderInfo } from "providers";
import { OwncastProvider } from "providers/owncast";
import { useState } from "react";

export function ConfigureOwncast() {
    const [url, setUrl] = useState("");
    const [token, setToken] = useState("");
    const [info, setInfo] = useState<StreamProviderInfo>();

    async function tryConnect() {
        try {
            const api = new OwncastProvider(url, token);
            const i = await api.info();
            setInfo(i);
        }
        catch (e) {
            console.debug(e);
        }
    }

    function status() {
        if (!info) return;

        return <>
            <h3>Status</h3>
            <div>
                <StatePill state={info?.state ?? StreamState.Ended} />
            </div>
            <div>
                <p>Name</p>
                <div className="paper">
                    {info?.name}
                </div>
            </div>
            {info?.summary && <div>
                <p>Summary</p>
                <div className="paper">
                    {info?.summary}
                </div>
            </div>}
            {info?.viewers && <div>
                <p>Viewers</p>
                <div className="paper">
                    {info?.viewers}
                </div>
            </div>}
            {info?.version && <div>
                <p>Version</p>
                <div className="paper">
                    {info?.version}
                </div>
            </div>}
            <div>
                <button className="btn btn-border">
                    Save
                </button>
            </div>
        </>
    }

    return <div className="owncast-config">
        <div className="flex f-col g24">
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
            <AsyncButton className="btn btn-primary" onClick={tryConnect}>
                Connect
            </AsyncButton>
        </div>
        <div>
            {status()}
        </div>
    </div>
}