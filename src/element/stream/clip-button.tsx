import { useLogin } from "@/hooks/login"
import { useContext, useEffect, useMemo, useState } from "react"
import { NostrStreamProvider, adaptPublisher } from "@/providers"
import { FormattedMessage } from "react-intl"
import { SnortContext } from "@snort/system-react"
import { LinkScope, NostrLink, type TaggedNostrEvent } from "@snort/system"

import { LIVE_STREAM_CLIP, StreamState } from "@/const"
import { extractStreamInfo } from "@/utils"
import { Icon } from "../icon"
import { unwrap } from "@snort/shared"
import { TimelineBar } from "../timeline"
import { DefaultButton } from "../buttons"
import Modal from "../modal"

export function ClipButton({ ev }: { ev: TaggedNostrEvent }) {
  const system = useContext(SnortContext)
  const { id, service, status, host } = extractStreamInfo(ev)
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const login = useLogin()
  const [open, setOpen] = useState(false)
  const [tempClipId, setTempClipId] = useState<string>()
  const [start, setStart] = useState(0)
  const [length, setLength] = useState(0.1)
  const [clipLength, setClipLength] = useState(0)
  const [title, setTitle] = useState("")

  const publisher = useMemo(() => login?.publisher(), [login])

  useEffect(() => {
    if (video) {
      video.currentTime = clipLength * start
    }
  }, [video, clipLength, start])

  useEffect(() => {
    if (!video) return
    const end = clipLength * (start + length)
    const onTimeUpdate = () => {
      if (video.currentTime >= end) {
        video.pause()
      }
    }
    video.addEventListener("timeupdate", onTimeUpdate)
    return () => video.removeEventListener("timeupdate", onTimeUpdate)
  }, [video, clipLength, start, length])

  const provider = useMemo(
    () =>
      service ? new NostrStreamProvider("", service, publisher ? adaptPublisher(publisher) : undefined) : undefined,
    [service, publisher],
  )

  if (!service || !provider || status !== StreamState.Live) return

  async function makeClip() {
    if (!provider || !id || !publisher) return

    const clip = await provider.prepareClip(id)
    console.debug(clip)

    setTempClipId(clip.id)
    setClipLength(clip.length)
    setOpen(true)
  }

  async function saveClip() {
    if (!provider || !id || !publisher || !tempClipId) return

    const newClip = await provider.createClip(id, tempClipId, clipLength * start, clipLength * length)
    const ee = await publisher.generic(eb => {
      const link = NostrLink.fromEvent(ev)
      link.scope = LinkScope.Root
      return eb
        .kind(LIVE_STREAM_CLIP)
        .tag(unwrap(link.toEventTag()))
        .tag(["p", host ?? ev.pubkey])
        .tag(["r", newClip.url])
        .tag(["title", title])
        .tag(["alt", `Live stream clip created on https://zap.stream\n${newClip.url}`])
    })
    console.debug(ee)
    await system.BroadcastEvent(ee)
    setOpen(false)
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
            {id && tempClipId && <video ref={setVideo} src={provider.getTempClipUrl(id, tempClipId)} controls muted />}
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
  )
}
