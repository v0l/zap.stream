import "./profile-page.css";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import {
  parseNostrLink,
  NostrPrefix,
  ParsedZap,
  encodeTLV,
} from "@snort/system";
import { useUserProfile } from "@snort/system-react";
import { Profile } from "element/profile";
import { Icon } from "element/icon";
import { SendZapsDialog } from "element/send-zap";
import { VideoTile } from "element/video-tile";
import { useProfile } from "hooks/profile";
import useTopZappers from "hooks/top-zappers";
import { Text } from "element/text";
import { Tags } from "element/tags";
import { StreamState, System } from "index";
import { findTag } from "utils";
import { formatSats } from "number";

function Zapper({ pubkey, total }: { pubkey: string; total: number }) {
  return (
    <div className="zapper">
      <Profile pubkey={pubkey} />
      <div className="zapper-amount">
        <Icon name="zap-filled" className="zap-icon" />
        <p className="top-zapper-amount">{formatSats(total)}</p>
      </div>
    </div>
  );
}

function TopZappers({ zaps }: { zaps: ParsedZap[] }) {
  const zappers = useTopZappers(zaps);
  return (
    <section className="profile-top-zappers">
      {zappers.map((z) => (
        <Zapper key={z.pubkey} pubkey={z.pubkey} total={z.total} />
      ))}
    </section>
  );
}

const defaultBanner = "https://void.cat/d/Hn1AdN5UKmceuDkgDW847q.webp";

export function ProfilePage() {
  const navigate = useNavigate();
  const params = useParams();
  const link = parseNostrLink(params.npub!);
  const profile = useUserProfile(System, link.id);
  const zapTarget = profile?.lud16 ?? profile?.lud06;
  const { streams, zaps } = useProfile(link, true);
  const liveEvent = useMemo(() => {
    return streams.find((ev) => findTag(ev, "status") === StreamState.Live);
  }, [streams]);
  const pastStreams = useMemo(() => {
    return streams.filter((ev) => findTag(ev, "status") === StreamState.Ended);
  }, [streams]);
  const futureStreams = useMemo(() => {
    return streams.filter(
      (ev) => findTag(ev, "status") === StreamState.Planned
    );
  }, [streams]);
  const isLive = Boolean(liveEvent);

  function goToLive() {
    if (liveEvent) {
      const d =
        liveEvent.tags?.find((t: string[]) => t?.at(0) === "d")?.at(1) || "";
      const naddr = encodeTLV(
        NostrPrefix.Address,
        d,
        undefined,
        liveEvent.kind,
        liveEvent.pubkey
      );
      navigate(`/${naddr}`);
    }
  }

  // todo: follow

  return (
    <div className="profile-page">
      <div className="profile-container">
        <img
          className="banner"
          alt={profile?.name || link.id}
          src={profile?.banner || defaultBanner}
        />
        <div className="profile-content">
          {profile?.picture && (
            <img
              className="avatar"
              alt={profile.name || link.id}
              src={profile.picture}
            />
          )}
          <div className="status-indicator">
            {isLive ? (
              <div className="icon-button pill live" onClick={goToLive}>
                <Icon name="signal" />
                <span>live</span>
              </div>
            ) : (
              <span className="pill offline">offline</span>
            )}
          </div>
          <div className="profile-actions">
            {zapTarget && (
              <SendZapsDialog
                lnurl={zapTarget}
                button={
                  <button className="btn">
                    <div className="icon-button">
                      <span>Zap</span>
                      <Icon name="zap-filled" className="zap-button-icon" />
                    </div>
                  </button>
                }
                targetName={profile?.name || link.id}
              />
            )}
          </div>
          <div className="profile-information">
            {profile?.name && <h1 className="name">{profile.name}</h1>}
            {profile?.about && (
              <p className="bio">
                <Text content={profile.about} tags={[]} />
              </p>
            )}
          </div>
          <Tabs.Root className="tabs-root" defaultValue="top-zappers">
            <Tabs.List
              className="tabs-list"
              aria-label={`Information about ${
                profile ? profile.name : link.id
              }`}
            >
              <Tabs.Trigger className="tabs-tab" value="top-zappers">
                Top Zappers
              </Tabs.Trigger>
              <Tabs.Trigger className="tabs-tab" value="past-streams">
                Past Streams
              </Tabs.Trigger>
              <Tabs.Trigger className="tabs-tab" value="schedule">
                Schedule
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content className="tabs-content" value="top-zappers">
              <TopZappers zaps={zaps} />
            </Tabs.Content>
            <Tabs.Content className="tabs-content" value="past-streams">
              <div className="stream-list">
                {pastStreams.map((ev) => (
                  <div key={ev.id} className="stream-item">
                    <VideoTile ev={ev} />
                    <Tags ev={ev} />
                  </div>
                ))}
              </div>
            </Tabs.Content>
            <Tabs.Content className="tabs-content" value="schedule">
              <div className="stream-list">
                {futureStreams.map((ev) => (
                  <div key={ev.id} className="stream-item">
                    <VideoTile ev={ev} />
                    <Tags ev={ev} />
                  </div>
                ))}
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
    </div>
  );
}
