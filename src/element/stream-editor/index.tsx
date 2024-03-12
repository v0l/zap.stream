import "./index.css";
import { useCallback, useEffect, useState } from "react";
import { NostrEvent } from "@snort/system";
import { unixNow } from "@snort/shared";
import { FormattedMessage, useIntl } from "react-intl";

import { extractStreamInfo, findTag } from "@/utils";
import { useLogin } from "@/hooks/login";
import { StreamState } from "@/const";
import { DefaultButton } from "@/element/buttons";
import Pill from "@/element/pill";

import { NewGoalDialog } from "./new-goal";
import { StreamInput } from "./input";
import { GoalSelector } from "./goal-selector";
import GameDatabase, { GameInfo } from "@/service/game-database";
import CategoryInput from "./category-input";

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

export function StreamEditor({ ev, onFinish, options }: StreamEditorProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [image, setImage] = useState("");
  const [stream, setStream] = useState("");
  const [recording, setRecording] = useState("");
  const [status, setStatus] = useState("");
  const [start, setStart] = useState<string>();
  const [tags, setTags] = useState<string[]>([]);
  const [contentWarning, setContentWarning] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [goal, setGoal] = useState<string>();
  const [game, setGame] = useState<GameInfo>();
  const [gameId, setGameId] = useState<string>();
  const login = useLogin();
  const { formatMessage } = useIntl();

  useEffect(() => {
    const { gameInfo, gameId, title, summary, image, stream, status, starts, tags, contentWarning, goal, recording } =
      extractStreamInfo(ev);
    setTitle(title ?? "");
    setSummary(summary ?? "");
    setImage(image ?? "");
    setStream(stream ?? "");
    setStatus(status ?? StreamState.Live);
    setRecording(recording ?? "");
    setStart(starts);
    setTags(tags ?? []);
    setContentWarning(contentWarning !== undefined);
    setGoal(goal);
    setGameId(gameId);
    if (gameInfo) {
      setGame(gameInfo);
    } else if (gameId) {
      new GameDatabase().getGame(gameId).then(setGame);
    }
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
          .tag(["status", status])
          .tag(["starts", starts]);
        if (status === StreamState.Live) {
          eb.tag(["streaming", stream]);
        }
        if (status === StreamState.Ended) {
          eb.tag(["ends", ends]);
          if (recording) {
            eb.tag(["recording", recording]);
          }
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
        if (gameId) {
          eb.tag(["t", gameId]);
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
        <StreamInput label={<FormattedMessage defaultMessage="Title" />}>
          <input
            type="text"
            placeholder={formatMessage({ defaultMessage: "What are we steaming today?" })}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </StreamInput>
      )}
      {(options?.canSetSummary ?? true) && (
        <StreamInput label={<FormattedMessage defaultMessage="Summary" />}>
          <input
            type="text"
            placeholder={formatMessage({ defaultMessage: "A short description of the content" })}
            value={summary}
            onChange={e => setSummary(e.target.value)}
          />
        </StreamInput>
      )}
      {(options?.canSetImage ?? true) && (
        <StreamInput label={<FormattedMessage defaultMessage="Cover Image" />}>
          <div className="flex gap-2">
            <input type="text" placeholder="https://" value={image} onChange={e => setImage(e.target.value)} />
            <DefaultButton>
              <FormattedMessage defaultMessage="Upload" />
            </DefaultButton>
          </div>
        </StreamInput>
      )}
      {(options?.canSetStream ?? true) && (
        <StreamInput label={<FormattedMessage defaultMessage="Stream URL" />}>
          <input type="text" placeholder="https://" value={stream} onChange={e => setStream(e.target.value)} />
          <small>
            <FormattedMessage defaultMessage="Stream type should be HLS" />
          </small>
        </StreamInput>
      )}
      {(options?.canSetStatus ?? true) && (
        <>
          <StreamInput label={<FormattedMessage defaultMessage="Status" />}>
            <div className="flex gap-2">
              {[StreamState.Live, StreamState.Planned, StreamState.Ended].map(v => (
                <Pill className={status === v ? " active" : ""} onClick={() => setStatus(v)} key={v}>
                  {v}
                </Pill>
              ))}
            </div>
          </StreamInput>
          {status === StreamState.Planned && (
            <StreamInput label={<FormattedMessage defaultMessage="Start Time" />}>
              <input
                type="datetime-local"
                value={toDateTimeString(Number(start ?? "0"))}
                onChange={e => setStart(fromDateTimeString(e.target.value).toString())}
              />
            </StreamInput>
          )}
          {status === StreamState.Ended && (
            <StreamInput label={<FormattedMessage defaultMessage="Recording URL" />}>
              <input type="text" value={recording} onChange={e => setRecording(e.target.value)} />
            </StreamInput>
          )}
        </>
      )}
      {(options?.canSetTags ?? true) && (
        <CategoryInput
          tags={tags}
          game={game}
          gameId={gameId}
          setTags={setTags}
          setGame={setGame}
          setGameId={setGameId}
        />
      )}
      {login?.pubkey && (
        <StreamInput label={<FormattedMessage defaultMessage="Goal" />}>
          <div className="flex flex-col gap-2">
            <GoalSelector goal={goal} onGoalSelect={setGoal} />
            <NewGoalDialog />
          </div>
        </StreamInput>
      )}
      {(options?.canSetContentWarning ?? true) && (
        <div className="flex gap-2 rounded-xl border border-warning px-4 py-3">
          <div>
            <input type="checkbox" checked={contentWarning} onChange={e => setContentWarning(e.target.checked)} />
          </div>
          <div>
            <div className="text-warning">
              <FormattedMessage defaultMessage="NSFW Content" />
            </div>
            <FormattedMessage
              defaultMessage="Check here if this stream contains nudity or pornographic content."
              id="lZpRMR"
            />
          </div>
        </div>
      )}
      <div>
        <DefaultButton disabled={!isValid} onClick={publishStream}>
          <FormattedMessage defaultMessage="Save" />
        </DefaultButton>
      </div>
    </>
  );
}
