import "./stream-editor.css";
import { useCallback, useEffect, useState } from "react";
import { NostrEvent } from "@snort/system";
import { unixNow } from "@snort/shared";
import { TagsInput } from "react-tag-input-component";
import { FormattedMessage, useIntl } from "react-intl";

import AsyncButton from "./async-button";
import { StreamState } from "@/index";
import { findTag } from "@/utils";
import { useLogin } from "@/hooks/login";
import { NewGoalDialog } from "./new-goal";
import { useGoals } from "@/hooks/goals";

export interface StreamEditorProps {
  ev?: NostrEvent;
  onFinish?: (ev: NostrEvent) => void;
  options?: {
    canSetTitle?: boolean;
    canSetSummary?: boolean;
    canSetImage?: boolean;
    canSetStatus?: boolean;
    canSetStream?: boolean;
    canSetTags?: boolean;
    canSetContentWarning?: boolean;
  };
}

interface GoalSelectorProps {
  goal?: string;
  pubkey: string;
  onGoalSelect: (g: string) => void;
}

function GoalSelector({ goal, pubkey, onGoalSelect }: GoalSelectorProps) {
  const goals = useGoals(pubkey, true);
  const { formatMessage } = useIntl();
  return (
    <select onChange={ev => onGoalSelect(ev.target.value)}>
      <option value={goal}>{formatMessage({ defaultMessage: "Select a goal...", id: "I/TubD" })}</option>
      {goals?.map(x => (
        <option key={x.id} value={x.id}>
          {x.content}
        </option>
      ))}
    </select>
  );
}

export function StreamEditor({ ev, onFinish, options }: StreamEditorProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [image, setImage] = useState("");
  const [stream, setStream] = useState("");
  const [status, setStatus] = useState("");
  const [start, setStart] = useState<string>();
  const [tags, setTags] = useState<string[]>([]);
  const [contentWarning, setContentWarning] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [goal, setGoal] = useState<string>();
  const login = useLogin();
  const { formatMessage } = useIntl();

  useEffect(() => {
    setTitle(findTag(ev, "title") ?? "");
    setSummary(findTag(ev, "summary") ?? "");
    setImage(findTag(ev, "image") ?? "");
    setStream(findTag(ev, "streaming") ?? "");
    setStatus(findTag(ev, "status") ?? StreamState.Live);
    setStart(findTag(ev, "starts"));
    setTags(ev?.tags.filter(a => a[0] === "t").map(a => a[1]) ?? []);
    setContentWarning(findTag(ev, "content-warning") !== undefined);
    setGoal(findTag(ev, "goal"));
  }, [ev?.id]);

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
    const pub = login?.publisher();
    if (pub) {
      const evNew = await pub.generic(eb => {
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
        if (contentWarning) {
          eb.tag(["content-warning", "nsfw"]);
        }
        if (goal && goal.length > 0) {
          eb.tag(["goal", goal]);
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
      {(options?.canSetTitle ?? true) && (
        <div>
          <p>
            <FormattedMessage defaultMessage="Title" id="9a9+ww" />
          </p>
          <div className="paper">
            <input
              type="text"
              placeholder={formatMessage({ defaultMessage: "What are we steaming today?", id: "QRHNuF" })}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
        </div>
      )}
      {(options?.canSetSummary ?? true) && (
        <div>
          <p>
            <FormattedMessage defaultMessage="Summary" id="RrCui3" />
          </p>
          <div className="paper">
            <input
              type="text"
              placeholder={formatMessage({ defaultMessage: "A short description of the content", id: "mtNGwh" })}
              value={summary}
              onChange={e => setSummary(e.target.value)}
            />
          </div>
        </div>
      )}
      {(options?.canSetImage ?? true) && (
        <div>
          <p>
            <FormattedMessage defaultMessage="Cover Image" id="Gq6x9o" />
          </p>
          <div className="paper">
            <input type="text" placeholder="https://" value={image} onChange={e => setImage(e.target.value)} />
          </div>
        </div>
      )}
      {(options?.canSetStream ?? true) && (
        <div>
          <p>
            <FormattedMessage defaultMessage="Stream URL" id="QRRCp0" />
          </p>
          <div className="paper">
            <input type="text" placeholder="https://" value={stream} onChange={e => setStream(e.target.value)} />
          </div>
          <small>
            <FormattedMessage defaultMessage="Stream type should be HLS" id="oZrFyI" />
          </small>
        </div>
      )}
      {(options?.canSetStatus ?? true) && (
        <>
          <div>
            <p>
              <FormattedMessage defaultMessage="Status" id="tzMNF3" />
            </p>
            <div className="flex g12">
              {[StreamState.Live, StreamState.Planned, StreamState.Ended].map(v => (
                <span className={`pill${status === v ? " active" : ""}`} onClick={() => setStatus(v)} key={v}>
                  {v}
                </span>
              ))}
            </div>
          </div>
          {status === StreamState.Planned && (
            <div>
              <p>
                <FormattedMessage defaultMessage="Start Time" id="5QYdPU" />
              </p>
              <div className="paper">
                <input
                  type="datetime-local"
                  value={toDateTimeString(Number(start ?? "0"))}
                  onChange={e => setStart(fromDateTimeString(e.target.value).toString())}
                />
              </div>
            </div>
          )}
        </>
      )}
      {(options?.canSetTags ?? true) && (
        <div>
          <p>
            <FormattedMessage defaultMessage="Tags" id="1EYCdR" />
          </p>
          <div className="paper">
            <TagsInput value={tags} onChange={setTags} placeHolder="Music,DJ,English" separators={["Enter", ","]} />
          </div>
        </div>
      )}
      {login?.pubkey && (
        <>
          <div>
            <p>
              <FormattedMessage defaultMessage="Goal" id="0VV/sK" />
            </p>
            <div className="paper">
              <GoalSelector goal={goal} pubkey={login?.pubkey} onGoalSelect={setGoal} />
            </div>
          </div>
          <NewGoalDialog />
        </>
      )}
      {(options?.canSetContentWarning ?? true) && (
        <div className="flex g12 content-warning">
          <div>
            <input type="checkbox" checked={contentWarning} onChange={e => setContentWarning(e.target.checked)} />
          </div>
          <div>
            <div className="warning">
              <FormattedMessage defaultMessage="NSFW Content" id="Atr2p4" />
            </div>
            <FormattedMessage
              defaultMessage="Check here if this stream contains nudity or pornographic content."
              id="lZpRMR"
            />
          </div>
        </div>
      )}
      <div>
        <AsyncButton type="button" className="btn btn-primary wide" disabled={!isValid} onClick={publishStream}>
          {ev ? (
            <FormattedMessage defaultMessage="Save" id="jvo0vs" />
          ) : (
            <FormattedMessage defaultMessage="Start Stream" id="TaTRKo" />
          )}
        </AsyncButton>
      </div>
    </>
  );
}
