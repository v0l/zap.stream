import { bytesToHex } from "@noble/curves/abstract/utils";
import { schnorr } from "@noble/curves/secp256k1";
import { ExternalStore, unwrap } from "@snort/shared";
import { EventPublisher, Nip7Signer, PrivateKeySigner } from "@snort/system";
import type { EmojiPack, Tags } from "@/types";

export enum LoginType {
  Nip7 = "nip7",
  PrivateKey = "private-key",
}

interface ReplaceableTags {
  tags: Tags;
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
  color?: string;
  wallet?: {
    type: number;
    data: string;
  };
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

  takeSnapshot() {
    return this.#session ? { ...this.#session } : undefined;
  }

  setFollows(follows: Tags, content: string, ts: number) {
    if (!this.#session) return;
    if (this.#session.follows.timestamp >= ts) {
      return;
    }
    this.#session.follows.tags = follows;
    this.#session.follows.content = content;
    this.#session.follows.timestamp = ts;
    this.#save();
  }

  setEmojis(emojis: Array<EmojiPack>) {
    if (!this.#session) return;
    this.#session.emojis = emojis;
    this.#save();
  }

  setMuted(muted: Tags, content: string, ts: number) {
    if (!this.#session) return;
    if (this.#session.muted.timestamp >= ts) {
      return;
    }
    this.#session.muted.tags = muted;
    this.#session.muted.content = content;
    this.#session.muted.timestamp = ts;
    this.#save();
  }

  setCards(cards: Tags, ts: number) {
    if (!this.#session) return;
    if (this.#session.cards.timestamp >= ts) {
      return;
    }
    this.#session.cards.tags = cards;
    this.#session.cards.timestamp = ts;
    this.#save();
  }

  setColor(color: string) {
    if (!this.#session) return;
    this.#session.color = color;
    this.#save();
  }

  update(fn: (s: LoginSession) => void) {
    if (!this.#session) return;
    fn(this.#session);
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
  const signer = getSigner(session);
  if (signer) {
    return new EventPublisher(signer, session.pubkey);
  }
}

export function getSigner(session: LoginSession) {
  switch (session?.type) {
    case LoginType.Nip7: {
      return new Nip7Signer();
    }
    case LoginType.PrivateKey: {
      return new PrivateKeySigner(unwrap(session.privateKey));
    }
  }
}

export const Login = new LoginStore();
