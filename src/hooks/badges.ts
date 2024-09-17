import { useMemo } from "react";

import { EventKind, NostrLink, RequestBuilder, TaggedNostrEvent } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

export interface BadgeAward {
  event: TaggedNostrEvent;
  awardees: Set<string>;
}

export function useBadgeAwards(pubkey: string, leaveOpen = true) {
  const subBadgeAwards = useMemo(() => {
    const rb = new RequestBuilder(`badges:${pubkey}`);
    rb.withOptions({ leaveOpen });
    if (pubkey) {
      rb.withFilter().authors([pubkey]).kinds([EventKind.BadgeAward]);
    }
    return rb;
  }, [pubkey]);

  const awards = useRequestBuilder(subBadgeAwards);
  return {
    awards: awards.map(
      a =>
        ({
          event: a,
          awardees: new Set(a.tags.filter(b => b[0] === "p").map(b => b[1])),
        }) as BadgeAward,
    ),
  };
}

export function useProfileBadges(pubkey: string) {
  const sub = new RequestBuilder(`profile-badges:${pubkey}`);
  sub.withFilter().kinds([EventKind.ProfileBadges]).authors([pubkey]).tag("d", ["profile_badges"]);
  const data = useRequestBuilder(sub).at(0);
  return {
    event: data,
    isAccepted: (link: NostrLink) => {
      if (!data) return false;
      const links = NostrLink.fromAllTags(data.tags);
      return links.some(a => a.equals(link));
    },
  };
}
