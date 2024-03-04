import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { EventKind, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

import { useUserEmojiPacks } from "@/hooks/emoji";
import { MUTED, USER_CARDS, USER_EMOJIS } from "@/const";
import type { Tags } from "@/types";
import { getPublisher, Login } from "@/login";

export function useLogin() {
  const session = useSyncExternalStore(
    c => Login.hook(c),
    () => Login.snapshot()
  );
  if (!session) return;
  return {
    ...session,
    publisher: () => {
      return getPublisher(session);
    },
  };
}

export function useLoginEvents(pubkey?: string, leaveOpen = false) {
  const [userEmojis, setUserEmojis] = useState<Tags>([]);
  const session = useSyncExternalStore(
    c => Login.hook(c),
    () => Login.snapshot()
  );

  const sub = useMemo(() => {
    if (!pubkey) return null;
    const b = new RequestBuilder(`login:${pubkey.slice(0, 12)}`);
    b.withOptions({
      leaveOpen,
    })
      .withFilter()
      .authors([pubkey])
      .kinds([EventKind.ContactList, MUTED, USER_EMOJIS, USER_CARDS]);
    return b;
  }, [pubkey, leaveOpen]);

  const data = useRequestBuilder(sub);

  useEffect(() => {
    if (!data) {
      return;
    }
    for (const ev of data) {
      if (ev?.kind === USER_EMOJIS) {
        setUserEmojis(ev.tags);
      }
      if (ev?.kind === USER_CARDS) {
        Login.setCards(ev.tags, ev.created_at);
      }
      if (ev?.kind === MUTED) {
        Login.setMuted(ev.tags, ev.content, ev.created_at);
      }
      if (ev?.kind === EventKind.ContactList) {
        Login.setFollows(ev.tags, ev.content, ev.created_at);
      }
    }
  }, [data]);

  const emojis = useUserEmojiPacks(pubkey, userEmojis);
  useEffect(() => {
    if (session) {
      Login.setEmojis(emojis);
    }
  }, [emojis]);
}
