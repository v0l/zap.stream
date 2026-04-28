export {
  NostrStreamProvider,
  TimeSync,
  timeSync,
  type Signer,
  type NostrEvent as ApiNostrEvent,
  type StreamDetails,
  type AccountResponse,
  type ForwardDest,
  type IngestEndpoint,
  type TopUpResponse,
  type BalanceHistoryResult,
  type StreamKeyItem,
  type StreamKeysResult,
  type MetricsMessage,
  type StreamInfo,
} from "@zap.stream/api";

import type { EventPublisher } from "@snort/system";
import type { Signer, NostrEvent as ApiNostrEvent } from "@zap.stream/api";

/**
 * Adapt an `@snort/system` EventPublisher to the `@zap.stream/api` Signer interface.
 */
export function adaptPublisher(pub: EventPublisher): Signer {
  return {
    getPubKey: () => pub.pubKey,
    sign: async (event: ApiNostrEvent) => {
      return await pub.generic(eb => {
        let builder = eb.kind(event.kind).content(event.content).createdAt(event.created_at);
        for (const tag of event.tags) {
          builder = builder.tag(tag);
        }
        return builder;
      });
    },
  };
}
