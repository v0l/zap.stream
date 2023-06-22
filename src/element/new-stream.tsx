import { useEffect, useState } from "react";
import { EventPublisher, NostrEvent } from "@snort/system";
import { unixNow } from "@snort/shared";
import "./new-stream.css";
import AsyncButton from "./async-button";
import { System } from "index";
import { findTag } from "utils";

export function NewStream({ ev, onFinish }: { ev?: NostrEvent, onFinish: () => void }) {
    const [title, setTitle] = useState(findTag(ev, "title") ?? "");
    const [summary, setSummary] = useState(findTag(ev, "summary") ?? "");
    const [image, setImage] = useState(findTag(ev, "image") ?? "");
    const [stream, setStream] = useState(findTag(ev, "streaming") ?? "");
    const [isValid, setIsValid] = useState(false);

    function validate() {
        if (title.length < 2) {
            return false;
        }
        if (stream.length < 5 || !stream.match(/^https?:\/\/.*\.m3u8?$/i)) {
            return false;
        }
        if (image.length > 0 && !image.match(/^https?:\/\//i)) {
            return false;
        }
        return true;
    }

    useEffect(() => {
        setIsValid(validate());
    }, [title, summary, image, stream]);

    async function publishStream() {
        const pub = await EventPublisher.nip7();
        if (pub) {
            const evNew = await pub.generic(eb => {
                const now = unixNow();
                const dTag = findTag(ev, "d") ?? now.toString();
                return eb.kind(30_311)
                    .tag(["d", dTag])
                    .tag(["title", title])
                    .tag(["summary", summary])
                    .tag(["image", image])
                    .tag(["streaming", stream])
                    .tag(["status", "live"])
            });
            console.debug(evNew);
            System.BroadcastEvent(evNew);
            onFinish();
        }
    }

    return <div className="new-stream">
        <h3>
            {ev ? "Edit Stream" : "New Stream"}
        </h3>
        <div>
            <p>
                Title
            </p>
            <div className="input">
                <input type="text" placeholder="What are we steaming today?" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
        </div>
        <div>
            <p>
                Summary
            </p>
            <div className="input">
                <input type="text" placeholder="A short description of the content" value={summary} onChange={e => setSummary(e.target.value)} />
            </div>
        </div>
        <div>
            <p>
                Cover image
            </p>
            <div className="input">
                <input type="text" placeholder="https://" value={image} onChange={e => setImage(e.target.value)} />
            </div>
        </div>
        <div>
            <p>
                Stream Url
            </p>
            <div className="input">
                <input type="text" placeholder="https://" value={stream} onChange={e => setStream(e.target.value)} />
            </div>
            <small>
                Stream type should be HLS
            </small>
        </div>
        <div>
            <AsyncButton type="button" className="btn btn-primary" disabled={!isValid} onClick={publishStream}>
                {ev ? "Save" : "Start Stream"}
            </AsyncButton>
        </div>
    </div>
}