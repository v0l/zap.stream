import "./index.css";
import { StreamProviders } from "providers";

import Owncast from "owncast.png";
import Cloudflare from "cloudflare.png";
import { useNavigate, useParams } from "react-router-dom";
import { ConfigureOwncast } from "./owncast";
import { ConfigureNostrType } from "./nostr";

export function StreamProvidersPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    function mapName(p: StreamProviders) {
        switch (p) {
            case StreamProviders.Owncast: return "Owncast"
            case StreamProviders.Cloudflare: return "Cloudflare"
            case StreamProviders.NostrType: return "Nostr Native"
        }
        return "Unknown"
    }

    function mapLogo(p: StreamProviders) {
        switch (p) {
            case StreamProviders.Owncast: return <img src={Owncast} />
            case StreamProviders.Cloudflare: return <img src={Cloudflare} />
        }
    }

    function providerLink(p: StreamProviders) {
        return <div className="paper">
            <h3>{mapName(p)}</h3>
            {mapLogo(p)}
            <button className="btn btn-border" onClick={() => navigate(p)}>
                + Configure
            </button>
        </div>
    }

    function index() {
        return <div className="stream-providers-page">
            <h1>Providers</h1>
            <p>Stream providers streamline the process of streaming on Nostr, some event accept lightning payments!</p>
            <div className="stream-providers-grid">
                {[StreamProviders.NostrType, StreamProviders.Owncast, StreamProviders.Cloudflare].map(v => providerLink(v))}
            </div>
        </div >
    }

    if (!id) {
        return index();
    } else {
        switch (id) {
            case StreamProviders.Owncast: {
                return <ConfigureOwncast />
            }
            case StreamProviders.NostrType: {
                return <ConfigureNostrType />
            }
        }
    }
}