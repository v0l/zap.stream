import "./index.css";
import { useCallback, useContext, useEffect, useState } from "react";
import { EventKind, NostrEvent } from "@snort/system";
import { unixNow } from "@snort/shared";
import { FormattedMessage, useIntl } from "react-intl";
import { SnortContext } from "@snort/system-react";

import { extractStreamInfo, findTag } from "@/utils";
import { useLogin } from "@/hooks/login";
import { GOAL, StreamState, defaultRelays } from "@/const";
import { DefaultButton } from "@/element/buttons";
import Pill from "@/element/pill";
import { StreamInput } from "./input";
import { GoalSelector } from "./goal-selector";
import GameDatabase, { GameInfo } from "@/service/game-database";
import CategoryInput from "./category-input";
import { FileUploader } from "@/element/file-uploader";
import AmountInput from "@/element/amount-input";

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
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalMount] = useState(0);
  const [game, setGame] = useState<GameInfo>();
  const [gameId, setGameId] = useState<string>();
  const [error, setError] = useState("");
  const login = useLogin();
  const { formatMessage } = useIntl();
  const system = useContext(SnortContext);

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
  }, []);

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
      let thisGoal = goal;
      if (!goal && goalName && goalAmount) {
        const goalEvent = await pub.generic(eb => {
          return eb
            .kind(GOAL)
            .tag(["amount", String(goalAmount * 1000)])
            .tag(["relays", ...Object.keys(defaultRelays)])
            .content(goalName);
        });
        await system.BroadcastEvent(goalEvent);
        thisGoal = goalEvent.id;
      }
      const evNew = await pub.generic(eb => {
        const now = unixNow();
        const dTag = findTag(ev, "d") ?? now.toString();
        const starts = start ?? now.toString();
        const ends = findTag(ev, "ends") ?? now.toString();
        eb.kind(EventKind.LiveEvent)
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
        if (thisGoal && thisGoal.length > 0) {
          eb.tag(["goal", thisGoal]);
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

  const startsTimestamp = Number(start ?? (new Date().getTime() / 1000));
  const startsDate = new Date(startsTimestamp * 1000);

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
          <textarea
            rows={5}
            placeholder={formatMessage({ defaultMessage: "A description of the stream" })}
            value={summary}
            onChange={e => setSummary(e.target.value)}
          />
        </StreamInput>
      )}
      {(options?.canSetImage ?? true) && (
        <StreamInput label={<FormattedMessage defaultMessage="Cover Image" />}>
          {image && <img src={image} className="mb-2 aspect-video object-cover rounded-xl max-h-[200px] mx-auto" />}
          <div className="flex gap-2">
            <input type="text" placeholder="https://" value={image} onChange={e => setImage(e.target.value)} />
            <FileUploader onResult={v => setImage(v ?? "")} onError={e => setError(e.toString())} />
          </div>
          {error && <b className="text-warning">{error}</b>}
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
            <div className="flex gap-2 uppercase">
              {[StreamState.Live, StreamState.Planned, StreamState.Ended].map(v => (
                <Pill selected={status === v} onClick={() => setStatus(v)} key={v}>
                  {v}
                </Pill>
              ))}
            </div>
          </StreamInput>
          {status === StreamState.Planned && (
            <StreamInput label={<FormattedMessage defaultMessage="Start Time" />}>
              <input
                type="datetime-local"
                value={`${startsDate.getFullYear().toString().padStart(4, "0")}-${(startsDate.getMonth() + 1).toString().padStart(2, "0")}-${startsDate.getDate().toString().padStart(2, "0")}T${startsDate.getHours().toString().padStart(2, "0")}:${startsDate.getMinutes().toString().padStart(2, "0")}`}
                onChange={e => {
                  setStart((new Date(e.target.value) / 1000).toString());
                }}
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
            {!goal && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={formatMessage({
                    defaultMessage: "Goal Name",
                  })}
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                />
                <AmountInput onChange={setGoalMount} />
              </div>
            )}
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
