import { StreamState } from "@/const"
import { DefaultButton, Layer2Button, PrimaryButton } from "@/element/buttons"
import { CopyField } from "@/element/copy-field"
import Modal from "@/element/modal"
import { StatePill } from "@/element/state-pill"
import { StreamEditor } from "@/element/stream-editor"
import { StreamInput } from "@/element/stream-editor/input"
import { FileUploader } from "@/element/file-uploader"
import type { NostrStreamProvider, StreamKeysResult } from "@/providers"
import { extractStreamInfo } from "@/utils"
import { useEffect, useState } from "react"
import { FormattedMessage, useIntl } from "react-intl"
import {
  actionsFor,
  buildRescheduleRequest,
  buildScheduleRequest,
  isFutureStart,
  sortShows,
  toLocalInput,
  toShow,
  type Show,
} from "./shows"

function defaultStart() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
  d.setMinutes(0, 0, 0)
  return toLocalInput(d)
}

function errorText(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export default function StreamKeyList({ provider, serverUrl }: { provider: NostrStreamProvider; serverUrl?: string }) {
  const [keys, setKeys] = useState<StreamKeysResult>()
  const [error, setError] = useState("")
  const [scheduling, setScheduling] = useState(false)
  const [created, setCreated] = useState<{ title: string; key: string }>()
  const [rescheduling, setRescheduling] = useState<Show>()
  const [editing, setEditing] = useState<Show>()

  async function loadKeys() {
    try {
      const k = await provider.streamKeys(0, 100)
      setKeys(Array.isArray(k) ? { items: k, page: 0, pageSize: 1000 } : k)
    } catch (e) {
      setError(errorText(e))
    }
  }

  useEffect(() => {
    loadKeys()
  }, [])

  const shows = keys ? sortShows(keys.items.map(toShow)) : []

  async function remove(show: Show) {
    if (!show.streamId) return
    try {
      setError("")
      await provider.deleteStream(show.streamId)
      await loadKeys()
    } catch (e) {
      setError(errorText(e))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 sm:grid-cols-2 text-sm">
        <p className="rounded-xl bg-layer-1 px-3 py-2.5">
          <b className="block text-text">
            <FormattedMessage defaultMessage="Primary key" />
          </b>
          <span className="text-layer-5">
            <FormattedMessage defaultMessage="Creates a new stream every time you go live." />
          </span>
        </p>
        <p className="rounded-xl bg-layer-1 px-3 py-2.5">
          <b className="block text-text">
            <FormattedMessage defaultMessage="Show key" />
          </b>
          <span className="text-layer-5">
            <FormattedMessage defaultMessage="Always goes live as that show, so its page and chat carry over." />
          </span>
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-display text-lg font-bold">
          <FormattedMessage defaultMessage="Your shows" />
        </h4>
        <PrimaryButton
          onClick={() => {
            setCreated(undefined)
            setScheduling(true)
          }}
        >
          <FormattedMessage defaultMessage="Schedule a show" />
        </PrimaryButton>
      </div>
      {keys && shows.length === 0 && (
        <p className="text-sm text-layer-4">
          <FormattedMessage defaultMessage="No shows yet. Schedule one to get a key you can reuse for every episode." />
        </p>
      )}
      {shows.length > 0 && (
        <ul className="flex flex-col divide-y divide-layer-2 rounded-xl border border-layer-2">
          {shows.map(show => (
            <ShowRow
              key={show.keyId}
              show={show}
              serverUrl={serverUrl}
              onReschedule={() => setRescheduling(show)}
              onEdit={() => setEditing(show)}
              onDelete={() => remove(show)}
            />
          ))}
        </ul>
      )}
      {error && <b className="text-warning">{error}</b>}
      {scheduling && (
        <ScheduleDialog
          provider={provider}
          serverUrl={serverUrl}
          created={created}
          onCreated={async c => {
            setCreated(c)
            await loadKeys()
          }}
          onClose={() => setScheduling(false)}
        />
      )}
      {rescheduling?.streamId && (
        <RescheduleDialog
          show={rescheduling}
          provider={provider}
          onDone={async () => {
            setRescheduling(undefined)
            await loadKeys()
          }}
          onClose={() => setRescheduling(undefined)}
        />
      )}
      {editing?.event && editing.streamId && (
        <Modal id="edit-show" title={editing.title} onClose={() => setEditing(undefined)}>
          <StreamEditor
            ev={editing.event}
            options={{ canSetStream: false, canSetStatus: false }}
            onFinish={async ev => {
              const info = extractStreamInfo(ev)
              await provider.patchStream({
                id: editing.streamId,
                title: info.title,
                summary: info.summary,
                image: info.image,
                tags: info.tags,
                goal: info.goal,
              })
              setEditing(undefined)
              await loadKeys()
            }}
          />
        </Modal>
      )}
    </div>
  )
}

function ShowRow({
  show,
  serverUrl,
  onReschedule,
  onEdit,
  onDelete,
}: {
  show: Show
  serverUrl?: string
  onReschedule: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { formatDate, formatTime } = useIntl()
  const actions = actionsFor(show.state)
  const when = show.starts ? new Date(show.starts * 1000) : undefined
  return (
    <li className="flex flex-col gap-3 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold truncate">
            {show.title || <FormattedMessage defaultMessage="Untitled show" />}
          </div>
          <div className="text-sm text-layer-4">
            {when ? (
              show.state === StreamState.Ended ? (
                <FormattedMessage
                  defaultMessage="Last aired {date}"
                  values={{
                    date: `${formatDate(when, { dateStyle: "medium" })}, ${formatTime(when, { timeStyle: "short" })}`,
                  }}
                />
              ) : (
                <FormattedMessage
                  defaultMessage="Starts {date}"
                  values={{
                    date: `${formatDate(when, { dateStyle: "medium" })}, ${formatTime(when, { timeStyle: "short" })}`,
                  }}
                />
              )
            ) : (
              <FormattedMessage defaultMessage="No start time" />
            )}
          </div>
        </div>
        <StatePill state={show.state} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {serverUrl && <CopyField label={<FormattedMessage defaultMessage="Server URL" />} value={serverUrl} />}
        <CopyField label={<FormattedMessage defaultMessage="Stream key" />} value={show.key} secret={true} />
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.includes("reschedule") && show.streamId && (
          <Layer2Button onClick={onReschedule}>
            <FormattedMessage defaultMessage="Reschedule" />
          </Layer2Button>
        )}
        {actions.includes("edit") && show.event && show.streamId && (
          <Layer2Button onClick={onEdit}>
            <FormattedMessage defaultMessage="Edit details" />
          </Layer2Button>
        )}
        {actions.includes("delete") && show.streamId && (
          <Layer2Button className="text-warning" onClick={onDelete}>
            <FormattedMessage defaultMessage="Delete" />
          </Layer2Button>
        )}
      </div>
    </li>
  )
}

function RescheduleDialog({
  show,
  provider,
  onDone,
  onClose,
}: {
  show: Show
  provider: NostrStreamProvider
  onDone: () => void
  onClose: () => void
}) {
  const [start, setStart] = useState(defaultStart())
  const [error, setError] = useState("")
  return (
    <Modal
      id="reschedule-show"
      title={<FormattedMessage defaultMessage="Reschedule {title}" values={{ title: show.title }} />}
      onClose={onClose}
    >
      <p className="text-sm text-layer-5">
        <FormattedMessage defaultMessage="The next episode uses the same key, page and chat." />
      </p>
      <StreamInput label={<FormattedMessage defaultMessage="Start time" />}>
        <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
      </StreamInput>
      {error && <b className="text-warning">{error}</b>}
      <PrimaryButton
        disabled={!isFutureStart(start)}
        onClick={async () => {
          try {
            setError("")
            const req = buildRescheduleRequest(show.streamId as string, new Date(start))
            await provider.patchStream(req)
            onDone()
          } catch (e) {
            setError(errorText(e))
          }
        }}
      >
        <FormattedMessage defaultMessage="Reschedule" />
      </PrimaryButton>
    </Modal>
  )
}

function ScheduleDialog({
  provider,
  serverUrl,
  created,
  onCreated,
  onClose,
}: {
  provider: NostrStreamProvider
  serverUrl?: string
  created?: { title: string; key: string }
  onCreated: (c: { title: string; key: string }) => Promise<void>
  onClose: () => void
}) {
  const { formatMessage } = useIntl()
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [image, setImage] = useState("")
  const [tags, setTags] = useState("")
  const [start, setStart] = useState(defaultStart())
  const [error, setError] = useState("")
  const valid = title.trim().length >= 2 && isFutureStart(start) && (image === "" || /^https?:\/\//i.test(image))

  if (created) {
    return (
      <Modal id="schedule-show" title={<FormattedMessage defaultMessage="Show scheduled" />} onClose={onClose}>
        <p className="text-sm text-layer-5">
          <FormattedMessage
            defaultMessage="Put this in OBS once. The key is reusable for every episode of {title}."
            values={{ title: created.title }}
          />
        </p>
        {serverUrl && <CopyField label={<FormattedMessage defaultMessage="Server URL" />} value={serverUrl} />}
        <CopyField label={<FormattedMessage defaultMessage="Stream key" />} value={created.key} secret={true} />
        <DefaultButton onClick={onClose}>
          <FormattedMessage defaultMessage="Done" />
        </DefaultButton>
      </Modal>
    )
  }

  return (
    <Modal id="schedule-show" title={<FormattedMessage defaultMessage="Schedule a show" />} onClose={onClose}>
      <StreamInput label={<FormattedMessage defaultMessage="Title" />}>
        <input
          type="text"
          placeholder={formatMessage({ defaultMessage: "Name of the show" })}
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </StreamInput>
      <StreamInput label={<FormattedMessage defaultMessage="Summary" />}>
        <textarea rows={3} value={summary} onChange={e => setSummary(e.target.value)} />
      </StreamInput>
      <StreamInput label={<FormattedMessage defaultMessage="Cover Image" />}>
        <div className="flex gap-2">
          <input type="text" placeholder="https://" value={image} onChange={e => setImage(e.target.value)} />
          <FileUploader onResult={v => setImage(v ?? "")} onError={e => setError(String(e))} />
        </div>
      </StreamInput>
      <StreamInput label={<FormattedMessage defaultMessage="Tags" />}>
        <input
          type="text"
          placeholder={formatMessage({ defaultMessage: "Separate with commas" })}
          value={tags}
          onChange={e => setTags(e.target.value)}
        />
      </StreamInput>
      <StreamInput label={<FormattedMessage defaultMessage="Start time" />}>
        <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
      </StreamInput>
      {error && <b className="text-warning">{error}</b>}
      <PrimaryButton
        disabled={!valid}
        onClick={async () => {
          try {
            setError("")
            const req = buildScheduleRequest({
              title,
              summary,
              image,
              tags: tags.split(","),
              starts: new Date(start),
            })
            const rsp = await provider.createStreamKey(req)
            await onCreated({ title: title.trim(), key: rsp.key })
          } catch (e) {
            setError(errorText(e))
          }
        }}
      >
        <FormattedMessage defaultMessage="Schedule show" />
      </PrimaryButton>
    </Modal>
  )
}
