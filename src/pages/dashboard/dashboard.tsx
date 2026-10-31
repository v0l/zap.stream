import { LiveChat } from "@/element/chat/live-chat"
import LiveVideoPlayer from "@/element/stream/live-video-player"
import { EventExt, type NostrEvent } from "@snort/system"
import { SnortContext } from "@snort/system-react"
import { Suspense, lazy, useContext, useEffect, useMemo, useState } from "react"
import { FormattedMessage } from "react-intl"
import { StreamState, LIVE_STREAM } from "@/const"
import { useStream } from "@/element/stream/stream-state"
import { DashboardRaidButton } from "./button-raid"
import { DashboardZapColumn } from "./column-zaps"
import { DashboardChatList } from "./chat-list"
import { DashboardCard } from "./card"
import { NewStreamDialog } from "@/element/new-stream"
import DashboardIntro from "./intro"
import { useLocation, useNavigate } from "react-router"
import { useStreamProvider } from "@/hooks/stream-provider"
import { type AccountResponse, NostrStreamProvider, adaptPublisher } from "@/providers"
import { Layer2Button, PrimaryButton, WarningButton } from "@/element/buttons"
import { useLogin } from "@/hooks/login"
import { unixNow } from "@snort/shared"
import { Icon } from "@/element/icon"
import Modal from "@/element/modal"
import { AcceptTos } from "./tos"
import { pickEndpoint } from "./quality"
import { DashboardGoLiveCard } from "./go-live-card"
import { DashboardSettingsButton } from "./button-settings"
import { DashboardLiveStreamInfo } from "./live-stream-info"
import { DashboardHeader } from "./header"
import { DashboardWalletCard } from "./account-card"
const StreamSummary = lazy(() => import("@/element/summary-chart"))

export default function DashboardForLink() {
  const navigate = useNavigate()
  const { event: streamEvent, info: streamInfo, link: eventLink } = useStream()

  const location = useLocation()
  const system = useContext(SnortContext)
  const login = useLogin()
  const [info, setInfo] = useState<AccountResponse>()
  const [tos, setTos] = useState(info?.tos?.accepted ?? false)
  const [endpointName, setEndpointName] = useState(localStorage.getItem("dashboard-endpoint"))
  const { provider: streamProvider } = useStreamProvider()

  const isMyManual = streamEvent?.pubkey === login?.pubkey

  const provider = useMemo(() => {
    const publisher = login?.publisher?.()
    return streamInfo?.status === StreamState.Live && streamInfo?.service
      ? new NostrStreamProvider("", streamInfo?.service, publisher ? adaptPublisher(publisher) : undefined)
      : streamProvider
  }, [streamInfo?.service, streamInfo?.status, streamProvider, login?.pubkey])

  const endpoint = useMemo(() => pickEndpoint(info?.endpoints ?? [], endpointName), [info, endpointName])
  const [infoVersion, setInfoVersion] = useState(0)
  const reloadInfo = () => setInfoVersion(v => v + 1)

  useEffect(() => {
    if (!isMyManual) {
      let cancelled = false
      const load = () => {
        provider
          .info()
          .then(i => {
            if (!cancelled) setInfo(i)
          })
          .catch(() => {})
      }
      load()
      const t = setInterval(load, 1000 * 60)
      return () => {
        cancelled = true
        clearInterval(t)
      }
    }
  }, [isMyManual, provider.url, infoVersion])

  const streamToEdit =
    streamEvent ??
    (info?.details && !isMyManual
      ? {
          id: "",
          pubkey: login?.pubkey ?? "",
          created_at: 0,
          sig: "",
          content: "",
          kind: LIVE_STREAM,
          tags: [
            ["d", ""],
            ["title", info.details.title ?? ""],
            ["summary", info.details?.summary ?? ""],
            ["picture", info.details.image ?? ""],
            ["service", provider.url],
            ...(info.details.tags?.map(t => ["t", t]) ?? []),
          ],
        }
      : undefined)

  if (!eventLink && !location.search.includes("setupComplete=true")) {
    return <DashboardIntro />
  }

  const isLive = streamInfo?.status === StreamState.Live
  const isPlanned = streamInfo?.status === StreamState.Planned
  const isOffline = !eventLink || streamInfo?.status === StreamState.Ended || streamInfo?.status === undefined

  async function endManualStream() {
    const copy = streamEvent ? ({ ...streamEvent } as NostrEvent) : undefined
    const statusTag = copy?.tags.find(a => a[0] === "status")
    const endedTag = copy?.tags.find(a => a[0] === "ends")
    const pub = login?.signer()
    if (statusTag && copy && pub) {
      statusTag[1] = StreamState.Ended
      if (endedTag) {
        endedTag[1] = String(unixNow())
      } else {
        copy.tags.push(["ends", String(unixNow())])
      }
      copy.created_at = unixNow()
      copy.id = EventExt.createId(copy)
      const evPub = await pub.sign(copy)
      if (evPub) {
        await system.BroadcastEvent(evPub)
      }
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 min-w-0 xl:h-[calc(100dvh-var(--header-height))]">
      <DashboardHeader
        title={isLive || isPlanned ? streamInfo?.title : undefined}
        status={streamInfo?.status}
        actions={
          <>
            {eventLink && (isLive || isPlanned) && <DashboardRaidButton link={eventLink} />}
            <NewStreamDialog ev={streamToEdit} text={<FormattedMessage defaultMessage="Edit stream info" />} />
            {!isMyManual && <DashboardSettingsButton provider={provider} info={info} onChange={reloadInfo} />}
            {eventLink && isMyManual && (isLive || isPlanned) && (
              <WarningButton onClick={endManualStream}>
                <FormattedMessage defaultMessage="End stream" />
              </WarningButton>
            )}
          </>
        }
      />

      {isLive && eventLink && (
        <div className="grid gap-5 min-h-0 flex-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-5 min-h-0 xl:overflow-y-auto scrollbar-hidden [&>*]:shrink-0">
            {isMyManual ? (
              <DashboardCard flush>
                <LiveVideoPlayer
                  link={eventLink}
                  stream={streamInfo?.stream}
                  status={streamInfo?.status}
                  poster={streamInfo?.image ?? streamInfo?.thumbnail}
                  muted={true}
                  className="w-full rounded-2xl overflow-hidden"
                />
              </DashboardCard>
            ) : (
              <DashboardLiveStreamInfo provider={provider} />
            )}
            <DashboardCard
              title={<FormattedMessage defaultMessage="Chatters" />}
              flush
              bodyClassName="max-h-[360px] overflow-y-auto"
            >
              <DashboardChatList />
            </DashboardCard>
          </div>
          <DashboardZapColumn />
          <DashboardCard
            className="h-[70dvh] xl:h-auto xl:min-h-[520px]"
            flush
            bodyClassName="flex-1"
            title={<FormattedMessage defaultMessage="Stream chat" />}
            headerAction={
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm text-layer-4 hover:text-text cursor-pointer"
                onClick={() => {
                  window.open(
                    `${window.location.protocol}//${window.location.host}/chat/${eventLink.encode()}?chat=true`,
                    "",
                    "popup=true,width=400,height=800",
                  )
                }}
              >
                <Icon name="link" size={16} />
                <FormattedMessage defaultMessage="Pop out" />
              </button>
            }
          >
            <LiveChat className="flex-1 min-h-0 px-4 pt-2" showTopZappers={false} />
          </DashboardCard>
        </div>
      )}

      {!isLive && (
        <div className="grid gap-5 min-h-0 flex-1 xl:grid-cols-[400px_minmax(0,1fr)]">
          <div className="flex flex-col gap-5 min-h-0 xl:overflow-y-auto scrollbar-hidden [&>*]:shrink-0">
            {isPlanned && eventLink && isMyManual && (
              <DashboardCard flush>
                <LiveVideoPlayer
                  link={eventLink}
                  stream={streamInfo?.stream}
                  status={streamInfo?.status}
                  poster={streamInfo?.image ?? streamInfo?.thumbnail}
                  muted={true}
                  className="w-full rounded-2xl overflow-hidden"
                />
              </DashboardCard>
            )}
            {isOffline && (
              <DashboardGoLiveCard
                endpoints={info?.endpoints ?? []}
                endpoint={endpoint}
                setEndpoint={ep => {
                  setEndpointName(ep.name)
                  localStorage.setItem("dashboard-endpoint", ep.name)
                }}
              />
            )}
            {!isMyManual && (
              <DashboardWalletCard provider={provider} info={info} endpoint={endpoint} onChange={reloadInfo} />
            )}
          </div>
          <DashboardCard
            className="xl:overflow-y-auto self-start max-h-full"
            title={
              isPlanned ? (
                <FormattedMessage defaultMessage="Planned stream" />
              ) : (
                <FormattedMessage defaultMessage="Last stream" />
              )
            }
          >
            {eventLink && streamInfo?.status === StreamState.Ended ? (
              <Suspense>
                <StreamSummary link={eventLink} />
              </Suspense>
            ) : (
              <p className="text-layer-4">
                {isPlanned ? (
                  <FormattedMessage defaultMessage="Your stream will show up here when it goes live." />
                ) : (
                  <FormattedMessage defaultMessage="Your stream stats will show up here after your first stream." />
                )}
              </p>
            )}
          </DashboardCard>
        </div>
      )}
      {info && !info.tos?.accepted && (
        <Modal
          id="tos-dashboard"
          size="sm"
          title={<FormattedMessage defaultMessage="Accept the terms of service to continue" />}
        >
          <div className="flex flex-col gap-5">
            <AcceptTos provider={provider.name} tosLink={info?.tos?.link} tos={tos} setTos={setTos} />
            <div className="flex items-center justify-end gap-2">
              <Layer2Button onClick={() => navigate("/")}>
                <FormattedMessage defaultMessage="No thanks" />
              </Layer2Button>
              <PrimaryButton
                disabled={!tos}
                onClick={async () => {
                  if (tos) {
                    await provider.acceptTos()
                    provider.info().then(setInfo)
                  }
                }}
              >
                <FormattedMessage defaultMessage="Accept" />
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
