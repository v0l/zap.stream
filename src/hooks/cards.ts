import { useMemo } from "react";

import { RequestBuilder, TaggedNostrEvent } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

import { CARD, USER_CARDS } from "@/const";
import { findTag } from "@/utils";

export function useUserCards(pubkey: string, userCards: Array<string[]>, leaveOpen = false): TaggedNostrEvent[] {
  const related = useMemo(() => {
    // filtering to only show CARD kinds for now, but in the future we could link and render anything
    if (userCards?.length > 0) {
      return userCards.filter(t => t.at(0) === "a" && t.at(1)?.startsWith(`${CARD}:`));
    }
    return [];
  }, [userCards]);

  const subRelated = useMemo(() => {
    const splitted = related.map(t => t[1].split(":"));
    const authors = splitted
      .map(s => s.at(1))
      .filter(s => s)
      .map(s => s as string);
    const identifiers = splitted
      .map(s => s.at(2))
      .filter(s => s)
      .map(s => s as string);

    const rb = new RequestBuilder(`cards:${pubkey}`);

    if (pubkey) {
      rb.withOptions({ leaveOpen }).withFilter().kinds([CARD]).authors(authors).tag("d", identifiers);
    }

    return rb;
  }, [pubkey, related]);

  const data = useRequestBuilder(subRelated);

  const cards = useMemo(() => {
    return related
      .map(t => {
        const [k, pubkey, identifier] = t[1].split(":");
        const kind = Number(k);
        return (data ?? []).find(e => e.kind === kind && e.pubkey === pubkey && findTag(e, "d") === identifier);
      })
      .filter(e => e)
      .map(e => e as TaggedNostrEvent);
  }, [related, data]);

  return cards;
}

export function useCards(pubkey?: string, leaveOpen = false): TaggedNostrEvent[] {
  const sub = useMemo(() => {
    const b = new RequestBuilder(`user-cards:${pubkey}`);

    if (pubkey) {
      b.withOptions({
        leaveOpen,
      })
        .withFilter()
        .authors([pubkey])
        .kinds([USER_CARDS]);
    }
    return b;
  }, [pubkey, leaveOpen]);

  const userCards = useRequestBuilder(sub);

  const related = useMemo(() => {
    // filtering to only show CARD kinds for now, but in the future we could link and render anything
    if (userCards.length > 0) {
      return userCards[0].tags.filter(t => t.at(0) === "a" && t.at(1)?.startsWith(`${CARD}:`));
    }
    return [];
  }, [userCards]);

  const subRelated = useMemo(() => {
    const splitted = related.map(t => t[1].split(":"));
    const authors = splitted
      .map(s => s.at(1))
      .filter(s => s)
      .map(s => s as string);
    const identifiers = splitted
      .map(s => s.at(2))
      .filter(s => s)
      .map(s => s as string);

    const rb = new RequestBuilder(`cards:${pubkey}`);

    if (pubkey) {
      rb.withOptions({ leaveOpen }).withFilter().kinds([CARD]).authors(authors).tag("d", identifiers);
    }

    return rb;
  }, [pubkey, related]);

  const data = useRequestBuilder(subRelated);
  const cardEvents = data ?? [];

  const cards = useMemo(() => {
    return related
      .map(t => {
        const [k, pubkey, identifier] = t[1].split(":");
        const kind = Number(k);
        return cardEvents.find(e => e.kind === kind && e.pubkey === pubkey && findTag(e, "d") === identifier);
      })
      .filter(e => e)
      .map(e => e as TaggedNostrEvent);
  }, [related, cardEvents]);

  return cards;
}
