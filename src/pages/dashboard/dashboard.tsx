import { LiveChat } from "@/element/chat/live-chat";
import LiveVideoPlayer from "@/element/stream/live-video-player";
import { EventExt, type NostrEvent } from "@snort/system";
import { SnortContext } from "@snort/system-react";
import { Suspense, lazy, useContext, useEffect, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { StreamState, LIVE_STREAM } from "@/const";
import { useStream } from "@/element/stream/stream-state";
import { DashboardRaidButton } from "./button-raid";
import { DashboardZapColumn } from "./column-zaps";
import { DashboardChatList } from "./chat-list";
import { DashboardCard } from "./card";
import { NewStreamDialog } from "@/element/new-stream";
import { DashboardSettingsButton } from "./button-settings";
import DashboardIntro from "./intro";
import { useLocation, useNavigate } from "react-router";
import StreamKey from "@/element/provider/nostr/stream-key";
import { useStreamProvider } from "@/hooks/stream-provider";
import { type AccountResponse, NostrStreamProvider } from "@/providers/zsz";
import { ExternalLink } from "@/element/external-link";
import { Layer1Button, Layer2Button, WarningButton } from "@/element/buttons";
import { useLogin } from "@/hooks/login";
import classNames from "classnames";
import ManualStream from "./manual-stream";
import { unixNow } from "@snort/shared";
import { Icon } from "@/element/icon";
import ForwardingModal from "./forwarding";
import BalanceHistoryModal from "./balance-history";
import Modal from "@/element/modal";
import { AcceptTos } from "./tos";
import { ProviderSelectorButton } from "./provider-selector";
import { DashboardLiveStreamInfo } from "./live-stream-info";
const StreamSummary = lazy(() => import("@/element/summary-chart"));

export default function DashboardForLink() {
  const navigate = useNavigate();
  const { event: streamEvent, info: streamInfo, link: eventLink } = useStream();

  const location = useLocation();
  const system = useContext(SnortContext);
  const login = useLogin();
  const [info, setInfo] = useState<AccountResponse>();
  const [tos, setTos] = useState(info?.tos?.accepted ?? false);
  const [recording, setRecording] = useState(Boolean(localStorage.getItem("default-recording") ?? "true"));
  const { provider: streamProvider } = useStreamProvider();

  const isMyManual = streamEvent?.pubkey === login?.pubkey;

  useEffect(() => {
    localStorage.setItem("default-recording", String(recording));
  }, [recording]);

  const provider = useMemo(
    () =>
      streamInfo?.status === StreamState.Live && streamInfo?.service
        ? new NostrStreamProvider("", streamInfo?.service)
        : streamProvider,
    [streamInfo?.service, streamInfo?.status, streamProvider],
  );

  const defaultEndpoint = useMemo(() => {
    const metricsEndpint = recording ? "Best" : "Good";
    return info?.endpoints?.find(a => a.name === metricsEndpint) ?? info?.endpoints?.at(0);
  }, [info, recording]);

  useEffect(() => {
    if (!isMyManual) {
      provider.info().then(setInfo);
      const t = setInterval(() => {
        provider.info().then(setInfo);
      }, 1000 * 60);
      return () => {
        clearInterval(t);
      };
    }
  }, [isMyManual, provider.url]);

  function headingText() {
    switch (streamInfo?.status) {
      case StreamState.Live:
        return <FormattedMessage defaultMessage="Started" />;
      case StreamState.Ended:
        return <FormattedMessage defaultMessage="Stopped" />;
      case StreamState.Planned:
        return <FormattedMessage defaultMessage="Planned" />;
    }
  }

  function headingDotStyle() {
    switch (streamInfo?.status) {
      case StreamState.Live:
        return "animate-pulse bg-green-500";
      case StreamState.Ended:
        return "bg-red-500";
      case StreamState.Planned:
        return "bg-yellow-500";
    }
  }

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
      : undefined);

  if (!eventLink && !location.search.includes("setupComplete=true")) {
    return <DashboardIntro />;
  }

  return (
    <div
      className={classNames("grid gap-2 h-[calc(100dvh-52px)] w-full", {
        "grid-cols-3": streamInfo?.status === StreamState.Live,
        "grid-cols-[20%_80%]": streamInfo?.status === StreamState.Ended || streamInfo?.status === undefined,
        "grid-cols-[40%_60%]": streamInfo?.status === StreamState.Planned,
      })}>
      <div className="min-h-0 h-full grid grid-rows-[min-content_auto] gap-2">
        <DashboardCard className="flex flex-col gap-4">
          {eventLink && streamInfo?.status !== StreamState.Live && (
            <div className="flex justify-between items-center">
              <h3>
                <FormattedMessage defaultMessage="Stream" />
              </h3>
              <div className="uppercase font-semibold flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${headingDotStyle()}`}></div>
                {headingText()}
              </div>
            </div>
          )}
          {eventLink && streamInfo?.status === StreamState.Live && !isMyManual && (
            <DashboardLiveStreamInfo provider={provider} />
          )}
          {eventLink &&
            isMyManual &&
            (streamInfo?.status === StreamState.Live || streamInfo?.status === StreamState.Planned) && (
              <>
                <LiveVideoPlayer
                  link={eventLink}
                  stream={streamInfo?.stream}
                  status={streamInfo?.status}
                  poster={streamInfo?.image ?? streamInfo?.thumbnail}
                  muted={true}
                  className="w-full"
                />
                <div className="grid gap-2 grid-cols-3">
                  <DashboardRaidButton link={eventLink} />
                  <NewStreamDialog ev={streamToEdit} text={<FormattedMessage defaultMessage="Edit Stream Info" />} />
                  <WarningButton
                    onClick={async () => {
                      //todo: clean this up
                      const copy = streamEvent ? ({ ...streamEvent } as NostrEvent) : undefined;
                      const statusTag = copy?.tags.find(a => a[0] === "status");
                      const endedTag = copy?.tags.find(a => a[0] === "ends");
                      const pub = login?.signer();
                      if (statusTag && copy && pub) {
                        statusTag[1] = StreamState.Ended;
                        if (endedTag) {
                          endedTag[1] = String(unixNow());
                        } else {
                          copy.tags.push(["ends", String(unixNow())]);
                        }
                        copy.created_at = unixNow();
                        copy.id = EventExt.createId(copy);
                        const evPub = await pub.sign(copy);
                        if (evPub) {
                          await system.BroadcastEvent(evPub);
                        }
                      }
                    }}>
                    <FormattedMessage defaultMessage="End Stream" />
                  </WarningButton>
                </div>
              </>
            )}
          {(!eventLink || streamInfo?.status === StreamState.Ended) && (
            <>
              <div className="bg-layer-1 rounded-xl aspect-video flex items-center justify-center uppercase text-warning font-semibold">
                <FormattedMessage defaultMessage="Offline" />
              </div>
              <NewStreamDialog ev={streamToEdit} text={<FormattedMessage defaultMessage="Edit Stream Info" />} />
              <div className="flex flex-col gap-4">
                <h3>
                  <FormattedMessage defaultMessage="Stream Setup" />
                </h3>
                <p className="text-layer-5">
                  <FormattedMessage
                    defaultMessage="To go live, copy and paste your Server URL and Stream Key below into your streaming software settings and press 'Start Streaming'. We recommend <a>OBS</a>."
                    values={{
                      a: c => <ExternalLink href="https://obsproject.com/">{c}</ExternalLink>,
                    }}
                  />
                </p>
                <div className="flex gap-4 items-center">
                  <input type="checkbox" checked={recording} onChange={e => setRecording(e.target.checked)} />
                  <FormattedMessage defaultMessage="Enable Recording" />
                </div>
                {defaultEndpoint && <StreamKey ep={defaultEndpoint} />}
                <ManualStream />
              </div>
            </>
          )}
        </DashboardCard>
        {eventLink && streamInfo?.status === StreamState.Live && (
          <DashboardCard className="flex flex-col gap-4">
            <h3>
              <FormattedMessage defaultMessage="Chat Users" />
            </h3>
            <div className="h-[calc(100%-4rem)] overflow-y-auto">
              <DashboardChatList />
            </div>
          </DashboardCard>
        )}
        {(!eventLink || streamInfo?.status !== StreamState.Live) && (
          <DashboardCard className="flex flex-col gap-4">
            <h3>
              <FormattedMessage defaultMessage="Account Setup" />
            </h3>
            <div className="flex gap-2 flex-wrap">
              <BalanceHistoryModal provider={provider} />
              <ForwardingModal provider={provider} />
              <DashboardSettingsButton ev={streamEvent} provider={provider} />
              <ProviderSelectorButton />
            </div>
          </DashboardCard>
        )}
      </div>
      {eventLink && streamInfo?.status === StreamState.Live && (
        <>
          <DashboardZapColumn />
          <div className="border border-layer-2 rounded-xl px-4 py-3 flex flex-col gap-2 min-h-0">
            <Layer1Button
              onClick={() => {
                window.open(
                  `${window.location.protocol}//${window.location.host}/chat/${eventLink.encode()}?chat=true`,
                  "",
                  "popup=true,width=400,height=800",
                );
              }}>
              <Icon name="link" size={24} />
              <FormattedMessage defaultMessage="Chat Popout" />
            </Layer1Button>
            <LiveChat className="grow min-h-0" />
          </div>
        </>
      )}
      {eventLink && streamInfo?.status === StreamState.Ended && (
        <DashboardCard className="overflow-y-auto">
            <h1>
              <FormattedMessage defaultMessage="Last Stream Summary" />
            </h1>
            <Suspense>
              <StreamSummary link={eventLink} />
            </Suspense>
          </DashboardCard>
      )}
      {eventLink && streamInfo?.status === StreamState.Planned && (
        <DashboardCard className="overflow-y-auto"></DashboardCard>
      )}
      {info && !info.tos?.accepted && (
        <Modal id="tos-dashboard">
          <div className="flex flex-col gap-4">
            <h2>Please accept TOS before continuing</h2>
            <AcceptTos provider={provider.name} tosLink={info?.tos?.link} tos={tos} setTos={setTos} />
            <div className="flex items-center justify-between">
              <Layer2Button
                disabled={!tos}
                onClick={async () => {
                  if (tos) {
                    await provider.acceptTos();
                    provider.info().then(setInfo);
                  }
                }}>
                <FormattedMessage defaultMessage="Save" />
              </Layer2Button>
              <WarningButton onClick={() => navigate("/")}>
                <FormattedMessage defaultMessage="No Thanks!" />
              </WarningButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
