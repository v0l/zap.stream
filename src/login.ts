import { ExternalStore, unwrap } from "@snort/shared";
import { EventKind, EventPublisher, Nip7Signer, PrivateKeySigner, UserState, type UserStateObject } from "@snort/system";

export enum LoginType {
  Nip7 = "nip7",
  PrivateKey = "private-key",
}

export interface LoginSession {
  type: LoginType;
  pubkey: string;
  privateKey?: string;
  state?: UserState<never>;
  color?: string;
  wallet?: {
    type: number;
    data: string;
  };
}

const SESSION_KEY = "session";

export class LoginStore extends ExternalStore<LoginSession | undefined> {
  #session?: LoginSession;

  constructor() {
    super();
    const json = window.localStorage.getItem(SESSION_KEY);
    if (json) {
      this.#session = JSON.parse(json);
      if (this.#session) {
        let save = false;
        this.#session.state = this.#makeState();
        this.#session.state?.on("change", () => {
          this.#save();
        });
        //reset
        this.#session.type ??= LoginType.Nip7;
        if ("cards" in this.#session) {
          delete this.#session.cards;
          save = true;
        }
        if ("emojis" in this.#session) {
          delete this.#session.emojis;
          save = true;
        }
        if ("follows" in this.#session) {
          delete this.#session.follows;
          save = true;
        }
        if ("muted" in this.#session) {
          delete this.#session.muted;
          save = true;
        }

        if (save) {
          this.#save();
        }
      }
    }
  }

  #makeState() {
    if (this.#session) {
      const ret = new UserState(
        this.#session.pubkey,
        undefined,
        this.#session.state as UserStateObject<never> | undefined,
      );
      ret.checkIsStandardList(EventKind.StorageServerList);
      ret.checkIsStandardList(EventKind.MuteList);
      return ret;
    }
  }

  loginWithPubkey(pk: string, type = LoginType.Nip7) {
    this.#session = {
      type,
      pubkey: pk,
    };
    this.#session.state = this.#makeState();
    this.#save();
  }

  loginWithPrivateKey(key: string) {
    const signer = new PrivateKeySigner(key);
    this.#session = {
      type: LoginType.PrivateKey,
      pubkey: signer.getPubKey(),
      privateKey: signer.privateKey,
    };
    this.#session.state = this.#makeState();
    this.#save();
  }

  logout() {
    this.#session = undefined;
    this.#save();
  }

  takeSnapshot() {
    return this.#session ? { ...this.#session } : undefined;
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
      const ses = { ...this.#session } as Record<string, unknown>;
      if (this.#session.state instanceof UserState) {
        ses.state = this.#session.state.serialize();
      }
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(ses));
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
