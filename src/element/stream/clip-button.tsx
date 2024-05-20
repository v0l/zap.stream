import { useLogin } from "@/hooks/login";
import { useContext, useEffect, useRef, useState } from "react";
import { NostrStreamProvider } from "@/providers";
import { FormattedMessage } from "react-intl";
import { SnortContext } from "@snort/system-react";
import { NostrLink, TaggedNostrEvent } from "@snort/system";

import { LIVE_STREAM_CLIP, StreamState } from "@/const";
import { extractStreamInfo } from "@/utils";
import { Icon } from "../icon";
import { unwrap } from "@snort/shared";
import { TimelineBar } from "../timeline";
import { DefaultButton } from "../buttons";
import Modal from "../modal";

export function ClipButton({ ev }: { ev: TaggedNostrEvent }) {
  const system = useContext(SnortContext);
  const { id, service, status, host } = extractStreamInfo(ev);
  const ref = useRef<HTMLVideoElement | null>(null);
  const login = useLogin();
  const [open, setOpen] = useState(false);
  const [tempClipId, setTempClipId] = useState<string>();
  const [start, setStart] = useState(0);
  const [length, setLength] = useState(0.1);
  const [clipLength, setClipLength] = useState(0);
  const [title, setTitle] = useState("");

  const publisher = login?.publisher();

  useEffect(() => {
    if (ref.current) {
      ref.current.currentTime = clipLength * start;
    }
  }, [ref.current, clipLength, start, length]);

  useEffect(() => {
    if (ref.current) {
      ref.current.ontimeupdate = () => {
        if (!ref.current) return;
        console.debug(ref.current.currentTime);
        const end = clipLength * (start + length);
        if (ref.current.currentTime >= end) {
          ref.current.pause();
        }
      };
    }
  }, [ref.current, clipLength, start, length]);

  if (!service || status !== StreamState.Live) return;
  const provider = new NostrStreamProvider("", service, publisher);

  async function makeClip() {
    if (!service || !id || !publisher) return;

    const clip = await provider.prepareClip(id);
    console.debug(clip);

    setTempClipId(clip.id);
    setClipLength(clip.length);
    setOpen(true);
  }

  async function saveClip() {
    if (!service || !id || !publisher || !tempClipId) return;

    const newClip = await provider.createClip(id, tempClipId, clipLength * start, clipLength * length);
    const ee = await publisher.generic(eb => {
      return eb
        .kind(LIVE_STREAM_CLIP)
        .tag(unwrap(NostrLink.fromEvent(ev).toEventTag("root")))
        .tag(["p", host ?? ev.pubkey])
        .tag(["r", newClip.url])
        .tag(["title", title])
        .tag(["alt", `Live stream clip created on https://zap.stream\n${newClip.url}`]);
    });
    console.debug(ee);
    await system.BroadcastEvent(ee);
    setOpen(false);
  }

  return (
    <>
      <DefaultButton onClick={makeClip}>
        <Icon name="scissor" />
        <FormattedMessage defaultMessage="Clip" />
      </DefaultButton>
      {open && (
        <Modal id="create-clip" onClose={() => setOpen(false)}>
          <div className="flex flex-col">
            <h1>
              <FormattedMessage defaultMessage="Clip" />
            </h1>
            {id && tempClipId && <video ref={ref} src={provider.getTempClipUrl(id, tempClipId)} controls muted />}
            <TimelineBar
              length={length}
              offset={start}
              width={300}
              height={60}
              setOffset={setStart}
              setLength={setLength}
            />
            <div className="flex flex-col gap-1">
              <small>
                <FormattedMessage defaultMessage="Clip title" id="YwzT/0" />
              </small>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Epic combo!" />
            </div>
            <DefaultButton onClick={saveClip}>
              <FormattedMessage defaultMessage="Publish Clip" id="jJLRgo" />
            </DefaultButton>
          </div>
        </Modal>
      )}
    </>
  );
}
