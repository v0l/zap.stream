import { VIDEO_KIND } from "@/const";
import { useStreamLink } from "@/hooks/stream-link";
import { getEventFromLocationState } from "@/utils";
import { NostrPrefix, EventKind } from "@snort/system";
import { useLocation } from "react-router-dom";
import { StreamPage } from "./stream-page";
import { VideoPage } from "./video";
import { EventEmbed as NostrEventElement } from "@/element/event-embed";
import { FormattedMessage } from "react-intl";
import { useLayout } from "./layout/context";
import classNames from "classnames";

export function LinkHandler() {
  const location = useLocation();
  const evPreload = getEventFromLocationState(location.state);
  const link = useStreamLink();
  const layoutContext = useLayout();

  if (!link) return;

  if (link.type === NostrPrefix.Event) {
    return (
      <div className="rounded-2xl px-4 py-3 md:w-[700px] mx-auto w-full">
        <NostrEventElement link={link} />
      </div>
    );
  } else if (link.kind === EventKind.LiveEvent) {
    return (
      <div className={classNames(layoutContext.showHeader ? "h-[calc(100dvh-44px)]" : "h-[calc(100dvh)]", "w-full")}>
        <StreamPage link={link} evPreload={evPreload} />
      </div>
    );
  } else if (link.kind === VIDEO_KIND) {
    return <VideoPage link={link} evPreload={evPreload} />;
  } else {
    return (
      <>
        <h3>
          <FormattedMessage defaultMessage="Unknown event link" />
        </h3>
      </>
    );
  }
}
