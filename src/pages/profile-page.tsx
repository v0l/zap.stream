import "./profile-page.css";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CachedMetadata, NostrEvent, NostrLink, TaggedNostrEvent, parseNostrLink } from "@snort/system";
import { useUserProfile } from "@snort/system-react";
import { unwrap } from "@snort/shared";
import { FormattedMessage } from "react-intl";

import { Icon } from "@/element/icon";
import { SendZapsDialog } from "@/element/send-zap";
import { VideoTile } from "@/element/video-tile";
import { FollowButton } from "@/element/follow-button";
import { MuteButton } from "@/element/mute-button";
import { useProfile } from "@/hooks/profile";
import { Text } from "@/element/text";
import { findTag, profileLink } from "@/utils";
import { StatePill } from "@/element/state-pill";
import { Avatar } from "@/element/avatar";
import { StreamState } from "@/const";
import { DefaultButton } from "@/element/buttons";
import { useGoals } from "@/hooks/goals";
import { Goal } from "@/element/goal";
import { TopZappers } from "@/element/top-zappers";
import { useClips } from "@/hooks/clips";
import { getName } from "@/element/profile";
import VideoGrid from "@/element/video-grid";

const defaultBanner = "https://void.cat/d/Hn1AdN5UKmceuDkgDW847q.webp";

export function ProfilePage() {
  const params = useParams();
  const link = parseNostrLink(unwrap(params.npub));
  const { streams, zaps } = useProfile(link, true);
  const profile = useUserProfile(link.id);

  const pastStreams = useMemo(() => {
    return streams.filter(ev => findTag(ev, "status") === StreamState.Ended);
  }, [streams]);

  return (
    <div className="flex flex-col gap-3 xl:px-4">
      <img
        className="rounded-xl object-cover h-[360px]"
        alt={profile?.name || link.id}
        src={profile?.banner ? profile?.banner : defaultBanner}
      />
      <ProfileHeader link={link} profile={profile} streams={streams} />
      <div className="grid lg:grid-cols-2 gap-4 py-2">
        <div>
          <h3 className="text-xl py-2">
            <FormattedMessage defaultMessage="All Time Top Zappers" id="FIDK5Y" />
          </h3>
          <div className="flex flex-col gap-4">
            <TopZappers zaps={zaps} limit={10} avatarSize={40} showName={true} />
          </div>
        </div>
        <div>
          <h3 className="text-xl py-2">
            <FormattedMessage defaultMessage="Zap Goals" id="LEmxc8" />
          </h3>
          <div className="flex flex-col gap-2">
            <ProfileZapGoals link={link} />
          </div>
        </div>
      </div>
      <h1>
        <FormattedMessage defaultMessage="Recent Clips" id="XMGfiA" />
      </h1>
      <div className="flex gap-4">
        <ProfileClips link={link} />
      </div>
      <h1>
        <FormattedMessage defaultMessage="Past Streams" id="UfSot5" />
      </h1>
      <ProfileStreamList streams={pastStreams} />
    </div>
  );
}

function ProfileHeader({
  profile,
  link,
  streams,
}: {
  profile?: CachedMetadata;
  link: NostrLink;
  streams: Array<NostrEvent>;
}) {
  const navigate = useNavigate();
  const liveEvent = useMemo(() => {
    return streams.find(ev => findTag(ev, "status") === StreamState.Live);
  }, [streams]);
  const zapTarget = profile?.lud16 ?? profile?.lud06;
  const isLive = Boolean(liveEvent);

  function goToLive() {
    if (liveEvent) {
      const evLink = NostrLink.fromEvent(liveEvent);
      navigate(`/${evLink.encode()}`);
    }
  }

  return (
    <div className="flex max-sm:flex-col gap-3 justify-between">
      <div className="flex items-center gap-3">
        <div className="relative flex flex-col items-center">
          <Avatar user={profile} pubkey={link.id} size={88} className="border border-4" />
          {isLive && <StatePill state={StreamState.Live} onClick={goToLive} className="absolute bottom-0 -mb-2" />}
        </div>
        <div className="flex flex-col gap-1">
          {profile?.name && <h1 className="name">{profile.name}</h1>}
          {profile?.about && (
            <p className="text-neutral-400">
              <Text content={profile.about} tags={[]} />
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {zapTarget && (
          <SendZapsDialog
            aTag={liveEvent ? `${liveEvent.kind}:${liveEvent.pubkey}:${findTag(liveEvent, "d")}` : undefined}
            lnurl={zapTarget}
            button={
              <DefaultButton>
                <Icon name="zap-filled" className="zap-button-icon" />
                <FormattedMessage defaultMessage="Zap" id="fBI91o" />
              </DefaultButton>
            }
            targetName={profile?.name || link.id}
          />
        )}
        <FollowButton pubkey={link.id} />
        <MuteButton pubkey={link.id} />
      </div>
    </div>
  );
}

function ProfileStreamList({ streams }: { streams: Array<TaggedNostrEvent> }) {
  if (streams.length === 0) {
    return <FormattedMessage defaultMessage="No streams yet" id="0rVLjV" />;
  }
  return (
    <VideoGrid>
      {streams.map(ev => (
        <div key={ev.id} className="flex flex-col gap-1">
          <VideoTile ev={ev} showAuthor={false} showStatus={false} />
          <span className="text-neutral-500">
            <FormattedMessage
              defaultMessage="Streamed on {date}"
              id="cvAsEh"
              values={{
                date: new Date(ev.created_at * 1000).toLocaleDateString(),
              }}
            />
          </span>
        </div>
      ))}
    </VideoGrid>
  );
}

function ProfileZapGoals({ link }: { link: NostrLink }) {
  const limit = 5;
  const goals = useGoals(link.id, false, limit);
  if (goals.length === 0) {
    return <FormattedMessage defaultMessage="No goals yet" id="ZaNcK4" />;
  }
  return goals
    .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
    .slice(0, limit)
    .map(a => (
      <div key={a.id} className="bg-layer-1 rounded-xl px-4 py-3">
        <Goal ev={a} confetti={false} />
      </div>
    ));
}

function ProfileClips({ link }: { link: NostrLink }) {
  const clips = useClips(link, 10);
  if (clips.length === 0) {
    return <FormattedMessage defaultMessage="No clips yet" id="ObZZEz" />;
  }
  return clips.map(a => <ProfileClip ev={a} key={a.id} />);
}

function ProfileClip({ ev }: { ev: NostrEvent }) {
  const profile = useUserProfile(ev.pubkey);
  const r = findTag(ev, "r");
  const title = findTag(ev, "title");
  return (
    <div className="w-[300px] flex flex-col gap-4 bg-layer-1 rounded-xl px-3 py-2">
      <span>
        <FormattedMessage
          defaultMessage="Clip by {name}"
          id="dkUMIH"
          values={{
            name: (
              <Link to={profileLink(profile, ev.pubkey)} className="font-medium text-primary">
                {getName(ev.pubkey, profile)}
              </Link>
            ),
          }}
        />
      </span>
      {title}
      <video src={r} controls />
    </div>
  );
}
