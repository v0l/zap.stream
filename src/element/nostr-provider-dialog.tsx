import { NostrEvent } from "@snort/system";
import { StreamProvider, StreamProviderInfo } from "providers";
import { useEffect, useState } from "react";
import { SendZaps } from "./send-zap";
import { StreamEditor, StreamEditorProps } from "./stream-editor";
import Spinner from "./spinner";
import { LIVE_STREAM } from "const";

const DummyEvent = { content: "", id: "", pubkey: "", sig: "", kind: LIVE_STREAM, created_at: 0, tags: [] } as NostrEvent;

export function NostrProviderDialog({ provider, ...others }: { provider: StreamProvider } & StreamEditorProps) {
    const [topup, setTopup] = useState(false);
    const [info, setInfo] = useState<StreamProviderInfo>();

    useEffect(() => {
        provider.info().then(v => setInfo(v));
    }, [provider]);

    if (!info) {
        return <Spinner />
    }

    if (topup) {
        return <SendZaps lnurl={{
            name: provider.name,
            canZap: false,
            maxCommentLength: 0,
            getInvoice: async (amount) => {
                const pr = await provider.topup(amount);
                return { pr };
            }
        }} onFinish={() => {
            provider.info().then(v => {
                setInfo(v);
                setTopup(false);
            });
        }} />
    }

    const streamEvent = others.ev ?? info.publishedEvent ?? DummyEvent;
    return <>
        <div>
            <p>Stream Url</p>
            <div className="paper">
                <input type="text" value={info.ingressUrl} disabled />
            </div>
        </div>
        <div>
            <p>Stream Key</p>
            <div className="flex g12">
                <div className="paper f-grow">
                    <input type="password" value={info.ingressKey} disabled />
                </div>
                <button className="btn btn-primary" onClick={() => window.navigator.clipboard.writeText(info.ingressKey ?? "")}>
                    Copy
                </button>
            </div>
        </div>
        <div>
            <p>Balance</p>
            <div className="flex g12">
                <div className="paper f-grow">
                    {info.balance?.toLocaleString()} sats
                </div>
                <button className="btn btn-primary" onClick={() => setTopup(true)}>
                    Topup
                </button>
            </div>
        </div>
        {streamEvent && <StreamEditor onFinish={(ex) => {
            provider.updateStreamInfo(ex);
            others.onFinish?.(ex);
        }} ev={streamEvent} options={{
            canSetStream: false,
            canSetStatus: false
        }} />}
    </>
}