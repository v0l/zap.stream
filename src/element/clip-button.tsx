import * as Dialog from "@radix-ui/react-dialog";
import { useLogin } from "@/hooks/login";
import { useContext, useEffect, useRef, useState } from "react";
import { NostrStreamProvider } from "@/providers";
import { FormattedMessage } from "react-intl";
import { SnortContext } from "@snort/system-react";
import { NostrLink, TaggedNostrEvent } from "@snort/system";

import AsyncButton from "./async-button";
import { LIVE_STREAM_CLIP, StreamState } from "@/const";
import { extractStreamInfo } from "@/utils";
import { Icon } from "./icon";
import { unwrap } from "@snort/shared";
import { TimelineBar } from "./timeline";

export function ClipButton({ ev }: { ev: TaggedNostrEvent }) {
  const system = useContext(SnortContext);
  const { id, service, status } = extractStreamInfo(ev);
  const ref = useRef<HTMLVideoElement | null>(null);
  const login = useLogin();
  const [open, setOpen] = useState(false);
  const [tempClipId, setTempClipId] = useState<string>();
  const [start, setStart] = useState(0);
  const [length, setLength] = useState(0.1);
  const [clipLength, setClipLength] = useState(0);

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
        .tag(["r", newClip.url])
        .tag(["alt", `Live stream clip created on https://zap.stream\n${newClip.url}`]);
    });
    console.debug(ee);
    await system.BroadcastEvent(ee);
    setOpen(false);
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <div className="contents">
            <AsyncButton onClick={makeClip} className="btn btn-primary">
              <Icon name="clapperboard" />
              <span className="max-lg:hidden">
                <FormattedMessage defaultMessage="Create Clip" id="PA0ej4" />
              </span>
            </AsyncButton>
          </div>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <div className="content-inner">
              <h1>
                <FormattedMessage defaultMessage="Create Clip" id="PA0ej4" />
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
              <AsyncButton onClick={saveClip}>
                <FormattedMessage defaultMessage="Publish Clip" id="jJLRgo" />
              </AsyncButton>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
