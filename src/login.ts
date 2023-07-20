import { bytesToHex } from "@noble/curves/abstract/utils";
import { schnorr } from "@noble/curves/secp256k1";
import { ExternalStore } from "@snort/shared";
import { EventPublisher, Nip7Signer, PrivateKeySigner } from "@snort/system";

export enum LoginType {
  Nip7 = "nip7",
  PrivateKey = "private-key",
}

export interface LoginSession {
  type: LoginType;
  pubkey: string;
  privateKey?: string;
  follows: string[];
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
      follows: [],
    };
    this.#save();
  }

  loginWithPrivateKey(key: string) {
    this.#session = {
      type: LoginType.PrivateKey,
      pubkey: bytesToHex(schnorr.getPublicKey(key)),
      privateKey: key,
      follows: [],
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
        session.pubkey
      );
    }
  }
}
