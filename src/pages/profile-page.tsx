import "./profile-page.css";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CachedMetadata, NostrEvent, NostrLink, TaggedNostrEvent } from "@snort/system";
import { useUserProfile } from "@snort/system-react";
import { FormattedMessage } from "react-intl";

import { Icon } from "@/element/icon";
import { SendZapsDialog } from "@/element/send-zap";
import { StreamTile } from "@/element/stream/stream-tile";
import { FollowButton } from "@/element/follow-button";
import { MuteButton } from "@/element/mute-button";
import { useProfile } from "@/hooks/profile";
import { Text } from "@/element/text";
import { findTag } from "@/utils";
import { StatePill } from "@/element/state-pill";
import { Avatar } from "@/element/avatar";
import { StreamState } from "@/const";
import { DefaultButton, WarningButton } from "@/element/buttons";
import { useGoals } from "@/hooks/goals";
import { Goal } from "@/element/goal";
import { TopZappers } from "@/element/top-zappers";
import { useProfileClips } from "@/hooks/clips";
import VideoGrid from "@/element/video-grid";
import { ClipTile } from "@/element/stream/clip-tile";
import useImgProxy from "@/hooks/img-proxy";
import { useStreamLink } from "@/hooks/stream-link";
import StreamService from "@/service/stream-service";

import { useLogin } from "@/hooks/login";

const defaultBanner = "https://void.cat/d/Hn1AdN5UKmceuDkgDW847q.webp";

export function ProfilePage() {
  const link = useStreamLink();
  const login = useLogin();
  const { streams, zaps } = useProfile(link, true);
  const profile = useUserProfile(link?.id);
  const { proxy } = useImgProxy();
  const isOwner = login?.pubkey === link?.id;

  const pastStreams = useMemo(() => {
    return streams.filter(ev => {
      const status = findTag(ev, "status");
      const isDeleted = findTag(ev, "deleted") === "1";
      return status === StreamState.Ended && (isOwner || !isDeleted);
    });
  }, [streams, isOwner]);

  if (!link) return;
  return (
    <div className="flex flex-col gap-3 xl:px-4 w-full">
      <img
        className="rounded-xl object-cover h-[360px]"
        alt={profile?.name || link.id}
        src={profile?.banner ? proxy(profile?.banner) : defaultBanner}
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
      <ProfileStreamList streams={pastStreams} isOwner={isOwner} />
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

function ProfileStreamList({ streams, isOwner }: { streams: Array<TaggedNostrEvent>; isOwner: boolean }) {
  const login = useLogin();
  const publisher = login?.publisher();
  const streamService = new StreamService(publisher);

  const deleteStream = async (ev: TaggedNostrEvent) => {
    if (!login?.pubkey) return;
    
    const streamId = findTag(ev, "d");
    if (!streamId) return;

    const success = await streamService.deleteStream(streamId);
    if (success) {
      // Refresh the page or update state as needed
      window.location.reload();
    } else {
      // Handle error - could show a toast notification
      console.error("Failed to delete stream");
    }
  };

  if (streams.length === 0) {
    return <FormattedMessage defaultMessage="No streams yet" id="0rVLjV" />;
  }
  
  return (
    <VideoGrid>
      {streams.map(ev => {
        const isDeleted = findTag(ev, "deleted") === "1";
        return (
          <div key={ev.id} className="flex flex-col gap-1">
            <div className="relative">
              <StreamTile ev={ev} showAuthor={false} showStatus={false} style="grid" />
              {isDeleted && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                  <span className="text-white font-semibold">
                    <FormattedMessage defaultMessage="Deleted" />
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">
                <FormattedMessage
                  defaultMessage="Streamed on {date}"
                  id="cvAsEh"
                  values={{
                    date: new Date(ev.created_at * 1000).toLocaleDateString(),
                  }}
                />
              </span>
              {isOwner && !isDeleted && (
                <WarningButton
                  onClick={() => deleteStream(ev)}
                  className="text-xs px-2 py-1">
                  <FormattedMessage defaultMessage="Delete" />
                </WarningButton>
              )}
            </div>
          </div>
        );
      })}
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
  const clips = useProfileClips(link, 10);
  if (clips.length === 0) {
    return <FormattedMessage defaultMessage="No clips yet" id="ObZZEz" />;
  }
  return clips.map(a => <ClipTile ev={a} key={a.id} />);
}
