import "./profile-page.css";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import { NostrPrefix, ParsedZap, TaggedNostrEvent, encodeTLV, parseNostrLink } from "@snort/system";
import { useUserProfile } from "@snort/system-react";
import { unwrap } from "@snort/shared";
import { FormattedMessage } from "react-intl";

import { Icon } from "@/element/icon";
import { SendZapsDialog } from "@/element/send-zap";
import { VideoTile } from "@/element/video-tile";
import { FollowButton } from "@/element/follow-button";
import { MuteButton } from "@/element/mute-button";
import { useProfile } from "@/hooks/profile";
import useTopZappers from "@/hooks/top-zappers";
import { Text } from "@/element/text";
import { StreamState } from "@/index";
import { findTag } from "@/utils";
import { StatePill } from "@/element/state-pill";
import { Avatar } from "@/element/avatar";
import { ZapperRow } from "@/element/zapper-row";


function TopZappers({ zaps }: { zaps: ParsedZap[] }) {
  const zappers = useTopZappers(zaps);
  return (
    <section className="flex flex-col gap-2">
      {zappers.map(z => (
        <ZapperRow key={z.pubkey} pubkey={z.pubkey} total={z.total} />
      ))}
    </section>
  );
}

const defaultBanner = "https://void.cat/d/Hn1AdN5UKmceuDkgDW847q.webp";

export function ProfilePage() {
  const navigate = useNavigate();
  const params = useParams();
  const link = parseNostrLink(unwrap(params.npub));
  const profile = useUserProfile(link.id);
  const zapTarget = profile?.lud16 ?? profile?.lud06;
  const { streams, zaps } = useProfile(link, true);
  const liveEvent = useMemo(() => {
    return streams.find(ev => findTag(ev, "status") === StreamState.Live);
  }, [streams]);
  const pastStreams = useMemo(() => {
    return streams.filter(ev => findTag(ev, "status") === StreamState.Ended);
  }, [streams]);
  const futureStreams = useMemo(() => {
    return streams.filter(ev => findTag(ev, "status") === StreamState.Planned);
  }, [streams]);
  const isLive = Boolean(liveEvent);

  function goToLive() {
    if (liveEvent) {
      const d = findTag(liveEvent, "d") || "";
      const naddr = encodeTLV(NostrPrefix.Address, d, undefined, liveEvent.kind, liveEvent.pubkey);
      navigate(`/${naddr}`);
    }
  }

  return (
    <div className="flex flex-col gap-3 max-sm:px-4">
      <img
        className="rounded-xl object-cover h-[360px]"
        alt={profile?.name || link.id}
        src={profile?.banner ? profile?.banner : defaultBanner}
      />
      <div className="flex justify-between">
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
                <button className="btn">
                  <Icon name="zap-filled" className="zap-button-icon" />
                  <FormattedMessage defaultMessage="Zap" id="fBI91o" />
                </button>
              }
              targetName={profile?.name || link.id}
            />
          )}
          <FollowButton pubkey={link.id} />
          <MuteButton pubkey={link.id} />
        </div>
      </div>
      <Tabs.Root className="tabs-root" defaultValue="top-zappers">
        <Tabs.List className="tabs-list" aria-label={`Information about ${profile ? profile.name : link.id}`}>
          <Tabs.Trigger className="tabs-tab" value="top-zappers">
            <FormattedMessage defaultMessage="Top Zappers" id="dVD/AR" />
            <div className="tab-border"></div>
          </Tabs.Trigger>
          <Tabs.Trigger className="tabs-tab" value="past-streams">
            <FormattedMessage defaultMessage="Past Streams" id="UfSot5" />
            <div className="tab-border"></div>
          </Tabs.Trigger>
          <Tabs.Trigger className="tabs-tab" value="schedule">
            <FormattedMessage defaultMessage="Schedule" id="hGQqkW" />
            <div className="tab-border"></div>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className="tabs-content" value="top-zappers">
          <TopZappers zaps={zaps} />
        </Tabs.Content>
        <Tabs.Content className="tabs-content" value="past-streams">
          <ProfileStreamList streams={pastStreams} />
        </Tabs.Content>
        <Tabs.Content className="tabs-content" value="schedule">
          <ProfileStreamList streams={futureStreams} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function ProfileStreamList({ streams }: { streams: Array<TaggedNostrEvent> }) {
  return <div className="flex gap-3 flex-wrap justify-center">
    {streams.map(ev => (
      <div key={ev.id} className="flex flex-col gap-1 sm:w-64 w-full">
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
  </div>;
}