import { EventKind, NostrLink, RequestBuilder, UserMetadata } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { useMemo } from "react";
import { StreamProviderConfig } from "./stream-provider";
import useWoT from "./wot";
import { P_TAG_HOST_WHITELIST } from "@/const";

export function useDiscoverProviders(): StreamProviderConfig[] {
  const wot = useWoT();

  const rb = new RequestBuilder("stream-providers");
  rb.withFilter()
    .kinds([EventKind.ApplicationHandler])
    .tag("k", [EventKind.LiveEvent.toString()])
    .tag("i", ["api:zap-stream"]);

  const events = useRequestBuilder(rb);

  const recommendationsRb = useMemo(() => {
    const rb = new RequestBuilder("stream-recommendations");
    if (events.length > 0) {
      rb.withFilter()
        .kinds([31989 as EventKind])
        .replyToLink(events.map(e => NostrLink.fromEvent(e)));
    }
    return rb;
  }, [events]);
  const recommendations = useRequestBuilder(recommendationsRb);

  const providers = useMemo(() => {
    const providerConfigs: StreamProviderConfig[] = [];

    for (const event of events) {
      try {
        const userMetadata: UserMetadata = JSON.parse(event.content);
        const evLink = NostrLink.fromEvent(event);
        const reccomendsThis = recommendations.filter(e => evLink.isReplyToThis(e));
        let defaultScore = P_TAG_HOST_WHITELIST.indexOf(event.pubkey);
        if (defaultScore === -1) {
          defaultScore = 1000;
        }
        const score =
          reccomendsThis.length === 0
            ? defaultScore
            : reccomendsThis.reduce((acc, v) => acc + wot.followDistance(v.pubkey), 0);

        // Only website is required
        if (userMetadata.website) {
          providerConfigs.push({
            name: userMetadata.name || "Unknown Provider",
            url: userMetadata.website,
            description: userMetadata.about,
            pubkey: event.pubkey,
            event: event,
            reccomendations: reccomendsThis,
            score,
          });
        }
      } catch (error) {
        console.warn("Failed to parse provider metadata:", error);
      }
    }

    return providerConfigs;
  }, [events, recommendations]);

  return providers.sort((a, b) => (a.score > b.score ? 1 : -1));
}
