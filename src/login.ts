import { bytesToHex } from "@noble/curves/abstract/utils";
import { schnorr } from "@noble/curves/secp256k1";
import { ExternalStore } from "@snort/shared";
import { EventPublisher, Nip7Signer, PrivateKeySigner } from "@snort/system";
import type { EmojiPack, Relays } from "types";
import { defaultRelays } from "const";

export enum LoginType {
  Nip7 = "nip7",
  PrivateKey = "private-key",
}

interface ReplaceableTags {
  tags: Array<string[]>;
  timestamp: number;
}

export interface LoginSession {
  type: LoginType;
  pubkey: string;
  privateKey?: string;
  follows: ReplaceableTags;
  muted: ReplaceableTags;
  relays: Relays;
  emojis: Array<EmojiPack>;
}

export class LoginStore extends ExternalStore<LoginSession | undefined> {
  #session?: LoginSession;

  constructor() {
    super();
    const json = window.localStorage.getItem("session");
    if (json) {
      this.#session = JSON.parse(json);
      if (this.#session) {
        this.#session.type ??= LoginType.Nip7;
      }
    }
  }

  loginWithPubkey(pk: string, type = LoginType.Nip7) {
    this.#session = {
      type,
      pubkey: pk,
      muted: { tags: [], timestamp: 0 },
      follows: { tags: [], timestamp: 0 },
      relays: defaultRelays,
      emojis: [],
    };
    this.#save();
  }

  loginWithPrivateKey(key: string) {
    this.#session = {
      type: LoginType.PrivateKey,
      pubkey: bytesToHex(schnorr.getPublicKey(key)),
      privateKey: key,
      follows: { tags: [], timestamp: 0 },
      muted: { tags: [], timestamp: 0 },
      emojis: [],
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

  #save() {
    if (this.#session) {
      window.localStorage.setItem("session", JSON.stringify(this.#session));
    } else {
      window.localStorage.removeItem("session");
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
