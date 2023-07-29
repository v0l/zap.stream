import { useSyncExternalStore, useMemo, useState, useEffect } from "react";

import { EventKind, NoteCollection, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";

import { useUserEmojiPacks } from "hooks/emoji";
import { USER_EMOJIS } from "const";
import { System, Login } from "index";
import {
  getPublisher,
  setMuted,
  setEmojis,
  setFollows,
  setRelays,
} from "login";

export function useLogin() {
  const session = useSyncExternalStore(
    (c) => Login.hook(c),
    () => Login.snapshot(),
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
  const [userEmojis, setUserEmojis] = useState([]);
  const session = useSyncExternalStore(
    (c) => Login.hook(c),
    () => Login.snapshot(),
  );

  useEffect(() => {
    if (session) {
      Object.entries(session.relays).forEach((params) => {
        const [relay, settings] = params;
        System.ConnectToRelay(relay, settings);
      });
    }
  }, [session]);

  const sub = useMemo(() => {
    if (!pubkey) return null;
    const b = new RequestBuilder(`login:${pubkey.slice(0, 12)}`);
    b.withOptions({
      leaveOpen,
    })
      .withFilter()
      .authors([pubkey])
      .kinds([
        EventKind.ContactList,
        EventKind.Relays,
        10_000 as EventKind,
        USER_EMOJIS,
      ]);
    return b;
  }, [pubkey, leaveOpen]);

  const { data } = useRequestBuilder<NoteCollection>(
    System,
    NoteCollection,
    sub,
  );

  useEffect(() => {
    if (!data) {
      return;
    }
    if (!session) {
      return;
    }
    for (const ev of data) {
      if (ev?.kind === USER_EMOJIS) {
        setUserEmojis(ev.tags);
      }
      if (ev?.kind === 10_000) {
        // todo: decrypt ev.content tags
        setMuted(session, ev.tags, ev.created_at);
      }
      if (ev?.kind === EventKind.ContactList) {
        setFollows(session, ev.tags, ev.created_at);
      }
      if (ev?.kind === EventKind.Relays) {
        setRelays(session, ev.tags, ev.created_at);
      }
    }
  }, [session, data]);

  const emojis = useUserEmojiPacks(pubkey, { tags: userEmojis });
  useEffect(() => {
    if (session) {
      setEmojis(session, emojis);
    }
  }, [session, emojis]);
}
