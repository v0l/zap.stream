import "./new-stream.css";

import { useEffect, useState } from "react";
import { EventPublisher, NostrEvent } from "@snort/system";
import { unixNow } from "@snort/shared";

import AsyncButton from "./async-button";
import { StreamState, System } from "index";
import { findTag } from "utils";

export function NewStream({
  ev,
  onFinish,
}: {
  ev?: NostrEvent;
  onFinish: (ev: NostrEvent) => void;
}) {
  const [title, setTitle] = useState(findTag(ev, "title") ?? "");
  const [summary, setSummary] = useState(findTag(ev, "summary") ?? "");
  const [image, setImage] = useState(findTag(ev, "image") ?? "");
  const [stream, setStream] = useState(findTag(ev, "streaming") ?? "");
  const [status, setStatus] = useState(findTag(ev, "status") ?? StreamState.Live);
  const [start, setStart] = useState(findTag(ev, "starts"));
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
      const evNew = await pub.generic((eb) => {
        const now = unixNow();
        const dTag = findTag(ev, "d") ?? now.toString();
        const starts = start ?? now.toString();
        const ends = findTag(ev, "ends") ?? now.toString();
        eb
          .kind(30_311)
          .tag(["d", dTag])
          .tag(["title", title])
          .tag(["summary", summary])
          .tag(["image", image])
          .tag(["streaming", stream])
          .tag(["status", status])
          .tag(["starts", starts]);
        if (status === StreamState.Ended) {
          eb.tag(["ends", ends]);
        }
        return eb;
      });
      console.debug(evNew);
      System.BroadcastEvent(evNew);
      onFinish(evNew);
    }
  }

  function toDateTimeString(n: number) {
    console.debug(n);
    return new Date(n * 1000).toISOString().substring(0, -1)
  }

  function fromDateTimeString(s: string) {
    console.debug(s);
    return Math.floor(new Date(s).getTime() / 1000)
  }

  return (
    <div className="new-stream">
      <h3>{ev ? "Edit Stream" : "New Stream"}</h3>
      <div>
        <p>Title</p>
        <div className="input">
          <input
            type="text"
            placeholder="What are we steaming today?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </div>
      <div>
        <p>Summary</p>
        <div className="input">
          <input
            type="text"
            placeholder="A short description of the content"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>
      </div>
      <div>
        <p>Cover image</p>
        <div className="input">
          <input
            type="text"
            placeholder="https://"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>
      </div>
      <div>
        <p>Stream Url</p>
        <div className="input">
          <input
            type="text"
            placeholder="https://"
            value={stream}
            onChange={(e) => setStream(e.target.value)}
          />
        </div>
        <small>Stream type should be HLS</small>
      </div>
      <div>
        <p>Status</p>
        <div className="flex g12">
          {[StreamState.Live, StreamState.Planned, StreamState.Ended].map(v => <span className={`pill${status === v ? " active" : ""}`} onClick={() => setStatus(v)}>
            {v}
          </span>)}
        </div>
      </div>
      {status === StreamState.Planned && <div>
        <p>Start Time</p>
        <div className="input">
          <input type="datetime-local" value={toDateTimeString(Number(start ?? "0"))} onChange={e => setStart(fromDateTimeString(e.target.value).toString())} />
        </div>
      </div>}
      <div>
        <AsyncButton
          type="button"
          className="btn btn-primary"
          disabled={!isValid}
          onClick={publishStream}
        >
          {ev ? "Save" : "Start Stream"}
        </AsyncButton>
      </div>
    </div>
  );
}
