import "./stream-editor.css";
import { useEffect, useState, useCallback } from "react";
import { EventPublisher, NostrEvent } from "@snort/system";
import { unixNow } from "@snort/shared";
import { TagsInput } from "react-tag-input-component";

import AsyncButton from "./async-button";
import { StreamState } from "../index";
import { findTag } from "../utils";

export interface StreamEditorProps {
  ev?: NostrEvent;
  onFinish?: (ev: NostrEvent) => void;
  options?: {
    canSetTitle?: boolean
    canSetSummary?: boolean
    canSetImage?: boolean
    canSetStatus?: boolean
    canSetStream?: boolean
  }
}

export function StreamEditor({ ev, onFinish, options }: StreamEditorProps) {
  const [title, setTitle] = useState(findTag(ev, "title") ?? "");
  const [summary, setSummary] = useState(findTag(ev, "summary") ?? "");
  const [image, setImage] = useState(findTag(ev, "image") ?? "");
  const [stream, setStream] = useState(findTag(ev, "streaming") ?? "");
  const [status, setStatus] = useState(
    findTag(ev, "status") ?? StreamState.Live
  );
  const [start, setStart] = useState(findTag(ev, "starts"));
  const [tags, setTags] = useState(
    ev?.tags.filter(a => a[0] === "t").map(a => a[1]) ?? []
  );
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback(() => {
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
  }, [title, image, stream]);

  useEffect(() => {
    setIsValid(ev !== undefined || validate());
  }, [validate, title, summary, image, stream]);

  async function publishStream() {
    const pub = await EventPublisher.nip7();
    if (pub) {
      const evNew = await pub.generic((eb) => {
        const now = unixNow();
        const dTag = findTag(ev, "d") ?? now.toString();
        const starts = start ?? now.toString();
        const ends = findTag(ev, "ends") ?? now.toString();
        eb.kind(30311)
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
        for (const tx of tags) {
          eb.tag(["t", tx.trim()]);
        }
        return eb;
      });
      console.debug(evNew);
      onFinish && onFinish(evNew);
    }
  }

  function toDateTimeString(n: number) {
    return new Date(n * 1000).toISOString().substring(0, -1);
  }

  function fromDateTimeString(s: string) {
    return Math.floor(new Date(s).getTime() / 1000);
  }

  return (
    <>
      <h3>{ev ? "Edit Stream" : "New Stream"}</h3>
      {(options?.canSetTitle === undefined || options.canSetTitle) && <div>
        <p>Title</p>
        <div className="paper">
          <input
            type="text"
            placeholder="What are we steaming today?"
            value={title}
            onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>}
      {(options?.canSetSummary === undefined || options.canSetSummary) && <div>
        <p>Summary</p>
        <div className="paper">
          <input
            type="text"
            placeholder="A short description of the content"
            value={summary}
            onChange={(e) => setSummary(e.target.value)} />
        </div>
      </div>}
      {(options?.canSetImage === undefined || options.canSetImage) && <div>
        <p>Cover image</p>
        <div className="paper">
          <input
            type="text"
            placeholder="https://"
            value={image}
            onChange={(e) => setImage(e.target.value)} />
        </div>
      </div>}
      {(options?.canSetStream === undefined || options.canSetStream) && <div>
        <p>Stream Url</p>
        <div className="paper">
          <input
            type="text"
            placeholder="https://"
            value={stream}
            onChange={(e) => setStream(e.target.value)} />
        </div>
        <small>Stream type should be HLS</small>
      </div>}
      {(options?.canSetStatus === undefined || options.canSetStatus) && <><div>
        <p>Status</p>
        <div className="flex g12">
          {[StreamState.Live, StreamState.Planned, StreamState.Ended].map(
            (v) => (
              <span
                className={`pill${status === v ? " active" : ""}`}
                onClick={() => setStatus(v)}
                key={v}
              >
                {v}
              </span>
            )
          )}
        </div>
      </div>
        {status === StreamState.Planned && (
          <div>
            <p>Start Time</p>
            <div className="input">
              <input
                type="datetime-local"
                value={toDateTimeString(Number(start ?? "0"))}
                onChange={(e) => setStart(fromDateTimeString(e.target.value).toString())} />
            </div>
          </div>
        )}</>}
      <div>
        <p>Tags</p>
        <div className="paper">
          <TagsInput
            value={tags}
            onChange={setTags}
            placeHolder="Music,DJ,English"
            separators={["\n",","]}
          />
        </div>
        <small>Stream type should be HLS</small>
      </div>
      <div>
        <AsyncButton
          type="button"
          className="btn btn-primary wide"
          disabled={!isValid}
          onClick={publishStream}
        >
          {ev ? "Save" : "Start Stream"}
        </AsyncButton>
      </div>
    </>
  );
}
