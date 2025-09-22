import { EventKind, RequestBuilder, UserMetadata } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { useMemo } from "react";
import { StreamProviderConfig } from "./stream-provider";

export function useDiscoverProviders(): StreamProviderConfig[] {
  const rb = new RequestBuilder("stream-providers");
  rb.withFilter()
    .kinds([EventKind.ApplicationHandler])
    .tag("k", [EventKind.LiveEvent.toString()])
    .tag("i", ["api:zap-stream"]);

  const events = useRequestBuilder(rb);

  const providers = useMemo(() => {
    const providerConfigs: StreamProviderConfig[] = [];

    for (const event of events) {
      try {
        const userMetadata: UserMetadata = JSON.parse(event.content);

        // Only website is required
        if (userMetadata.website) {
          providerConfigs.push({
            name: userMetadata.name || "Unknown Provider",
            url: userMetadata.website,
            description: userMetadata.about,
            pubkey: event.pubkey,
          });
        }
      } catch (error) {
        console.warn("Failed to parse provider metadata:", error);
      }
    }

    return providerConfigs;
  }, [events]);

  return providers;
}
