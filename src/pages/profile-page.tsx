import "./profile-page.css";
import { useMemo } from "react";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import { parseNostrLink, NostrPrefix, ParsedZap, encodeTLV } from "@snort/system";
import { useUserProfile } from "@snort/system-react";
import { unwrap } from "@snort/shared";
import { Profile } from "element/profile";
import { Icon } from "element/icon";
import { SendZapsDialog } from "element/send-zap";
import { VideoTile } from "element/video-tile";
import { FollowButton } from "element/follow-button";
import { MuteButton } from "element/mute-button";
import { useProfile } from "hooks/profile";
import useTopZappers from "hooks/top-zappers";
import usePlaceholder from "hooks/placeholders";
import { Text } from "element/text";
import { StreamState } from "index";
import { findTag } from "utils";
import { formatSats } from "number";
import { FormattedMessage } from "react-intl";

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
      {zappers.map(z => (
        <Zapper key={z.pubkey} pubkey={z.pubkey} total={z.total} />
      ))}
    </section>
  );
}

const defaultBanner = "https://void.cat/d/Hn1AdN5UKmceuDkgDW847q.webp";

export function ProfilePage() {
  const navigate = useNavigate();
  const params = useParams();
  const link = parseNostrLink(unwrap(params.npub));
  const placeholder = usePlaceholder(link.id);
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
    <div className="profile-page">
      <div className="profile-container">
        <img className="banner" alt={profile?.name || link.id} src={profile?.banner || defaultBanner} />
        <div className="profile-content">
          {profile?.picture ? (
            <img className="avatar" alt={profile.name || link.id} src={profile.picture} />
          ) : (
            <img className="avatar" alt={profile?.name || link.id} src={placeholder} />
          )}
          <div className="status-indicator">
            {isLive ? (
              <div className="live-button pill live" onClick={goToLive}>
                <Icon name="signal" />
                <span>
                  <FormattedMessage defaultMessage="live" />
                </span>
              </div>
            ) : (
              <span className="pill offline">
                <FormattedMessage defaultMessage="offline" />
              </span>
            )}
          </div>
          <div className="profile-actions">
            {zapTarget && (
              <SendZapsDialog
                aTag={liveEvent ? `${liveEvent.kind}:${liveEvent.pubkey}:${findTag(liveEvent, "d")}` : undefined}
                lnurl={zapTarget}
                button={
                  <button className="btn">
                    <div className="zap-button">
                      <Icon name="zap-filled" className="zap-button-icon" />
                      <span>
                        <FormattedMessage defaultMessage="Zap" />
                      </span>
                    </div>
                  </button>
                }
                targetName={profile?.name || link.id}
              />
            )}
            <FollowButton pubkey={link.id} />
            <MuteButton pubkey={link.id} />
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
            <Tabs.List className="tabs-list" aria-label={`Information about ${profile ? profile.name : link.id}`}>
              <Tabs.Trigger className="tabs-tab" value="top-zappers">
                <FormattedMessage defaultMessage="Top Zappers" />
                <div className="tab-border"></div>
              </Tabs.Trigger>
              <Tabs.Trigger className="tabs-tab" value="past-streams">
                <FormattedMessage defaultMessage="Past Streams" />
                <div className="tab-border"></div>
              </Tabs.Trigger>
              <Tabs.Trigger className="tabs-tab" value="schedule">
                <FormattedMessage defaultMessage="Schedule" />
                <div className="tab-border"></div>
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content className="tabs-content" value="top-zappers">
              <TopZappers zaps={zaps} />
            </Tabs.Content>
            <Tabs.Content className="tabs-content" value="past-streams">
              <div className="stream-list">
                {pastStreams.map(ev => (
                  <div key={ev.id} className="stream-item">
                    <VideoTile ev={ev} showAuthor={false} showStatus={false} />
                    <span className="timestamp">
                      <FormattedMessage
                        defaultMessage="Streamed on {date}"
                        values={{
                          date: moment(Number(ev.created_at) * 1000).format("MMM DD, YYYY"),
                        }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </Tabs.Content>
            <Tabs.Content className="tabs-content" value="schedule">
              <div className="stream-list">
                {futureStreams.map(ev => (
                  <div key={ev.id} className="stream-item">
                    <VideoTile ev={ev} showAuthor={false} showStatus={false} />
                    <span className="timestamp">
                      <FormattedMessage
                        defaultMessage="Scheduled for {date}"
                        values={{
                          date: moment(Number(ev.created_at) * 1000).format("MMM DD, YYYY h:mm:ss a"),
                        }}
                      />
                    </span>
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
