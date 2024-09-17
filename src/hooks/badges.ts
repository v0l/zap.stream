import { useMemo } from "react";

import { EventKind, RequestBuilder, TaggedNostrEvent } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

import { findTag, getTagValues, toAddress } from "@/utils";
import type { Badge } from "@/types";

export function useBadges(
  pubkey: string,
  since: number,
  leaveOpen = true,
): { badges: Badge[]; awards: TaggedNostrEvent[] } {
  const rb = useMemo(() => {
    const rb = new RequestBuilder(`badges:${pubkey}`);
    rb.withOptions({ leaveOpen });
    if (pubkey) {
      rb.withFilter().authors([pubkey]).kinds([EventKind.Badge, EventKind.BadgeAward]);
    }
    return rb;
  }, [pubkey, since]);

  const badgeEvents = useRequestBuilder(rb);

  const rawBadges = useMemo(() => {
    if (badgeEvents) {
      return badgeEvents.filter(e => e.kind === EventKind.Badge).sort((a, b) => b.created_at - a.created_at);
    }
    return [];
  }, [badgeEvents]);
  const badgeAwards = useMemo(() => {
    if (badgeEvents) {
      return badgeEvents.filter(e => e.kind === EventKind.BadgeAward);
    }
    return [];
  }, [badgeEvents]);

  const acceptedSub = useMemo(() => {
    const rb = new RequestBuilder(`accepted-badges:${pubkey}`);
    if (rawBadges.length > 0) {
      rb.withFilter().kinds([EventKind.ProfileBadges]).tag("d", ["profile_badges"]).tag("a", rawBadges.map(toAddress));
    }
    return rb;
  }, [rawBadges]);

  const acceptedStream = useRequestBuilder(acceptedSub);
  const acceptedEvents = acceptedStream ?? [];

  const badges = useMemo(() => {
    return rawBadges.map(e => {
      const name = findTag(e, "d") ?? "";
      const address = toAddress(e);
      const awardEvents = badgeAwards.filter(b => findTag(b, "a") === address);
      const awardees = new Set(awardEvents.map(e => getTagValues(e.tags, "p")).flat());
      const accepted = new Set(
        acceptedEvents
          .filter(pb => awardees.has(pb.pubkey))
          .filter(pb => pb.tags.find(t => t.at(0) === "a" && t.at(1) === address))
          .map(pb => pb.pubkey),
      );
      const thumb = findTag(e, "thumb");
      const image = findTag(e, "image");
      return { name, thumb, image, awardees, accepted };
    });
    return [];
  }, [rawBadges]);

  return { badges, awards: badgeAwards };
}
