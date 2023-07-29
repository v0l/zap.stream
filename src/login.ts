import { bytesToHex } from "@noble/curves/abstract/utils";
import { schnorr } from "@noble/curves/secp256k1";
import { ExternalStore } from "@snort/shared";
import { EventPublisher, Nip7Signer, PrivateKeySigner } from "@snort/system";
import type { EmojiPack } from "types";

export enum LoginType {
  Nip7 = "nip7",
  PrivateKey = "private-key",
}

interface ReplaceableTags {
  tags: Array<string[]>;
  content?: string;
  timestamp: number;
}

export interface LoginSession {
  type: LoginType;
  pubkey: string;
  privateKey?: string;
  follows: ReplaceableTags;
  muted: ReplaceableTags;
  cards: ReplaceableTags;
  emojis: Array<EmojiPack>;
}

const initialState = {
  follows: { tags: [], timestamp: 0 },
  muted: { tags: [], timestamp: 0 },
  cards: { tags: [], timestamp: 0 },
  emojis: [],
};

const SESSION_KEY = "session";

export class LoginStore extends ExternalStore<LoginSession | undefined> {
  #session?: LoginSession;

  constructor() {
    super();
    const json = window.localStorage.getItem(SESSION_KEY);
    if (json) {
      this.#session = { ...initialState, ...JSON.parse(json) };
      if (this.#session) {
        this.#session.type ??= LoginType.Nip7;
      }
    }
  }

  loginWithPubkey(pk: string, type = LoginType.Nip7) {
    this.#session = {
      type,
      pubkey: pk,
      ...initialState,
    };
    this.#save();
  }

  loginWithPrivateKey(key: string) {
    this.#session = {
      type: LoginType.PrivateKey,
      pubkey: bytesToHex(schnorr.getPublicKey(key)),
      privateKey: key,
      ...initialState,
    };
    this.#save();
  }

  logout() {
    this.#session = undefined;
    this.#save();
  }

  updateSession(s: LoginSession) {
    this.#session = s;
    this.#save();
  }

  takeSnapshot() {
    return this.#session ? { ...this.#session } : undefined;
  }

  setFollows(follows: Array<string>, content: string, ts: number) {
    if (this.#session.follows.timestamp >= ts) {
      return;
    }
    this.#session.follows.tags = follows;
    this.#session.follows.content = content;
    this.#session.follows.timestamp = ts;
    this.#save();
  }

  setEmojis(emojis: Array<EmojiPack>) {
    this.#session.emojis = emojis;
    this.#save();
  }

  setMuted(muted: Array<string[]>, content: string, ts: number) {
    if (this.#session.muted.timestamp >= ts) {
      return;
    }
    this.#session.muted.tags = muted;
    this.#session.muted.content = content;
    this.#session.muted.timestamp = ts;
    this.#save();
  }

  setCards(cards: Array<string[]>, ts: number) {
    if (this.#session.cards.timestamp >= ts) {
      return;
    }
    this.#session.cards.tags = cards;
    this.#session.cards.timestamp = ts;
    this.#save();
  }

  #save() {
    if (this.#session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(this.#session));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
    this.notifyChange();
  }
}

export function getPublisher(session: LoginSession) {
  switch (session?.type) {
    case LoginType.Nip7: {
      return new EventPublisher(new Nip7Signer(), session.pubkey);
    }
    case LoginType.PrivateKey: {
      return new EventPublisher(
        new PrivateKeySigner(session.privateKey!),
        session.pubkey,
      );
    }
  }
}

export function setFollows(
  state: LoginSession,
  follows: Array<string>,
  ts: number,
) {
  if (state.follows.timestamp >= ts) {
    return;
  }
  state.follows.tags = follows;
  state.follows.timestamp = ts;
}

export function setEmojis(state: LoginSession, emojis: Array<EmojiPack>) {
  state.emojis = emojis;
}

export function setMuted(
  state: LoginSession,
  muted: Array<string[]>,
  ts: number,
) {
  if (state.muted.timestamp >= ts) {
    return;
  }
  state.muted.tags = muted;
  state.muted.timestamp = ts;
}

export function setRelays(
  state: LoginSession,
  relays: Array<string>,
  ts: number,
) {
  if (state.relays.timestamp >= ts) {
    return;
  }
  state.relays = relays.reduce((acc, r) => {
    const [, relay] = r;
    const write = r.length === 2 || r.includes("write");
    const read = r.length === 2 || r.includes("read");
    return { ...acc, [relay]: { read, write } };
  }, {});
}
