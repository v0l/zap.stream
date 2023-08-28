import { useMemo } from "react";

import { TaggedNostrEvent, EventKind, NoteCollection, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

import { findTag, toAddress, getTagValues } from "utils";
import type { Badge } from "types";

export function useBadges(
  pubkey: string,
  since: number,
  leaveOpen = true
): { badges: Badge[]; awards: TaggedNostrEvent[] } {
  const rb = useMemo(() => {
    const rb = new RequestBuilder(`badges:${pubkey.slice(0, 12)}`);
    rb.withOptions({ leaveOpen });
    rb.withFilter().authors([pubkey]).kinds([EventKind.Badge]);
    rb.withFilter().authors([pubkey]).kinds([EventKind.BadgeAward]).since(since);
    return rb;
  }, [pubkey, since]);

  const { data: badgeEvents } = useRequestBuilder(NoteCollection, rb);

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
    if (rawBadges.length === 0) return null;
    const rb = new RequestBuilder(`accepted-badges:${pubkey.slice(0, 12)}`);
    rb.withFilter().kinds([EventKind.ProfileBadges]).tag("d", ["profile_badges"]).tag("a", rawBadges.map(toAddress));
    return rb;
  }, [rawBadges]);

  const acceptedStream = useRequestBuilder(NoteCollection, acceptedSub);
  const acceptedEvents = acceptedStream.data ?? [];

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
          .map(pb => pb.pubkey)
      );
      const thumb = findTag(e, "thumb");
      const image = findTag(e, "image");
      return { name, thumb, image, awardees, accepted };
    });
    return [];
  }, [rawBadges]);

  return { badges, awards: badgeAwards };
}
