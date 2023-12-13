import "./stream-page.css";
import { NostrLink, TaggedNostrEvent } from "@snort/system";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { NostrEvent } from "@snort/system";
import { SnortContext, useUserProfile } from "@snort/system-react";
import { FormattedMessage } from "react-intl";
import { Suspense, lazy, useContext } from "react";

const LiveVideoPlayer = lazy(() => import("@/element/live-video-player"));
import { extractStreamInfo, findTag, getEventFromLocationState, getHost } from "@/utils";
import { Profile, getName } from "@/element/profile";
import { LiveChat } from "@/element/live-chat";
import AsyncButton from "@/element/async-button";
import { useLogin } from "@/hooks/login";
import { useZapGoal } from "@/hooks/goals";
import { SendZapsDialog } from "@/element/send-zap";
import { NewStreamDialog } from "@/element/new-stream";
import { Tags } from "@/element/tags";
import { StatePill } from "@/element/state-pill";
import { StreamCards } from "@/element/stream-cards";
import { formatSats } from "@/number";
import { StreamTimer } from "@/element/stream-time";
import { ShareMenu } from "@/element/share-menu";
import { ContentWarningOverlay, isContentWarningAccepted } from "@/element/content-warning";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { useStreamLink } from "@/hooks/stream-link";
import { FollowButton } from "@/element/follow-button";
import { ClipButton } from "@/element/clip-button";
import { StreamState } from "@/const";

function ProfileInfo({ ev, goal }: { ev?: TaggedNostrEvent; goal?: TaggedNostrEvent }) {
  const system = useContext(SnortContext);
  const login = useLogin();
  const navigate = useNavigate();
  const host = getHost(ev);
  const profile = useUserProfile(host);
  const zapTarget = profile?.lud16 ?? profile?.lud06;

  const { status, participants, title, summary } = extractStreamInfo(ev);
  const isMine = ev?.pubkey === login?.pubkey;

  async function deleteStream() {
    const pub = login?.publisher();
    if (pub && ev) {
      const evDelete = await pub.delete(ev.id);
      console.debug(evDelete);
      await system.BroadcastEvent(evDelete);
      navigate("/");
    }
  }

  const viewers = Number(participants ?? "0");
  return (
    <>
      <div className="flex gap-2 max-lg:px-2 max-xl:flex-col">
        <div className="grow flex flex-col gap-2 max-xl:hidden">
          <h1>{title}</h1>
          <p>{summary}</p>
          <div className="tags">
            <StatePill state={status as StreamState} />
            <span className="pill bg-gray-1">
              <FormattedMessage defaultMessage="{n} viewers" id="3adEeb" values={{ n: formatSats(viewers) }} />
            </span>
            {status === StreamState.Live && (
              <span className="pill bg-gray-1">
                <StreamTimer ev={ev} />
              </span>
            )}
            {ev && <Tags ev={ev} />}
          </div>
          {isMine && (
            <div className="actions">
              {ev && <NewStreamDialog text="Edit" ev={ev} btnClassName="btn" />}
              <AsyncButton type="button" className="btn btn-warning" onClick={deleteStream}>
                <FormattedMessage defaultMessage="Delete" id="K3r6DQ" />
              </AsyncButton>
            </div>
          )}
        </div>
        <div className="flex justify-between sm:gap-4 max-sm:gap-2 nowrap max-md:flex-col lg:items-center">
          <Profile pubkey={host ?? ""} />
          <div className="flex gap-2">
            <FollowButton pubkey={host} hideWhenFollowing={true} />
            {ev && (
              <>
                <ShareMenu ev={ev} />
                <ClipButton ev={ev} />
                {zapTarget && (
                  <SendZapsDialog
                    lnurl={zapTarget}
                    pubkey={host}
                    aTag={`${ev.kind}:${ev.pubkey}:${findTag(ev, "d")}`}
                    eTag={goal?.id}
                    targetName={getName(ev.pubkey, profile)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function StreamPageHandler() {
  const location = useLocation();
  const evPreload = getEventFromLocationState(location.state);
  const link = useStreamLink();

  if (link) {
    return <StreamPage link={link} evPreload={evPreload} />;
  }
}

export function StreamPage({ link, evPreload }: { evPreload?: NostrEvent; link: NostrLink }) {
  const ev = useCurrentStreamFeed(link, true, evPreload);
  const host = getHost(ev);
  const evLink = ev ? NostrLink.fromEvent(ev) : undefined;
  const {
    title,
    summary,
    image,
    status,
    tags,
    contentWarning,
    stream,
    recording,
    goal: goalTag,
  } = extractStreamInfo(ev);
  const goal = useZapGoal(goalTag);

  if (contentWarning && !isContentWarningAccepted()) {
    return <ContentWarningOverlay />;
  }

  const descriptionContent = [
    title,
    (summary?.length ?? 0) > 0 ? summary : "Nostr live streaming",
    ...(tags ?? []),
  ].join(", ");
  return (
    <div className="stream-page full-page-height">
      <Helmet>
        <title>{`${title} - zap.stream`}</title>
        <meta name="description" content={descriptionContent} />
        <meta property="og:url" content={`https://${window.location.host}/${link.encode()}`} />
        <meta property="og:type" content="video" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={descriptionContent} />
        <meta property="og:image" content={image ?? ""} />
      </Helmet>
      <div className="video-content">
        <Suspense>
          <LiveVideoPlayer
            title={title}
            stream={status === StreamState.Live ? stream : recording}
            poster={image}
            status={status}
          />
        </Suspense>
        <ProfileInfo ev={ev} goal={goal} />
        <StreamCards host={host} />
      </div>
      <LiveChat
        link={evLink ?? link}
        ev={ev}
        goal={goal}
        options={{
          canWrite: status === StreamState.Live,
        }}
      />
    </div>
  );
}
