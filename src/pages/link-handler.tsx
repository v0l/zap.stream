import { LIVE_STREAM_KINDS, N94_LIVE_STREAM, OLD_SHORTS_KIND, OLD_VIDEO_KIND, SHORTS_KIND, VIDEO_KIND } from "@/const";
import { useStreamLink } from "@/hooks/stream-link";
import { getEventFromLocationState } from "@/utils";
import { useLocation } from "react-router";
import { StreamPage } from "./stream-page";
import { VideoPage } from "./video";
import { EventEmbed as NostrEventElement } from "@/element/event-embed";
import { FormattedMessage } from "react-intl";
import { useLayout } from "./layout/context";
import classNames from "classnames";
import { ShortPage } from "./short";
import { NostrPrefix } from "@snort/shared";

export function LinkHandler() {
  const location = useLocation();
  const evPreload = getEventFromLocationState(location.state);
  const link = useStreamLink(evPreload);
  const layoutContext = useLayout();

  if (!link) return;

  const nonGenericEvents = [N94_LIVE_STREAM, VIDEO_KIND, OLD_VIDEO_KIND, SHORTS_KIND, OLD_SHORTS_KIND];
  if (link.type === NostrPrefix.Event && nonGenericEvents.every(k => link.kind !== k)) {
    return <NostrEventElement link={link} />;
  } else if ((link.kind && LIVE_STREAM_KINDS.includes(link.kind)) || link.type === NostrPrefix.PublicKey) {
    return (
      <div className={classNames(layoutContext.showHeader ? "h-[calc(100dvh-44px)]" : "h-[calc(100dvh)]", "w-full")}>
        <StreamPage link={link} evPreload={evPreload} />
      </div>
    );
  } else if (link.kind === VIDEO_KIND || link.kind === OLD_VIDEO_KIND) {
    return <VideoPage link={link} evPreload={evPreload} />;
  } else if (link.kind === SHORTS_KIND || link.kind === OLD_SHORTS_KIND) {
    return <ShortPage link={link} evPreload={evPreload} />;
  } else {
    return (
      <h3>
          <FormattedMessage defaultMessage="Unknown event link" />
        </h3>
    );
  }
}
