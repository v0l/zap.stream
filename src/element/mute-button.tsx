import { useLogin } from "hooks/login";
import AsyncButton from "element/async-button";
import { Login, System } from "index";
import { MUTED } from "const";

export function LoggedInMuteButton({ pubkey }: { pubkey: string }) {
  const login = useLogin();
  const tags = login.muted.tags;
  const muted = tags.filter((t) => t.at(0) === "p");
  const isMuted = muted.find((t) => t.at(1) === pubkey);

  async function unmute() {
    const pub = login?.publisher();
    if (pub) {
      const newMuted = tags.filter((t) => t.at(1) !== pubkey);
      const ev = await pub.generic((eb) => {
        eb.kind(MUTED).content(login.muted.content);
        for (const t of newMuted) {
          eb.tag(t);
        }
        return eb;
      });
      console.debug(ev);
      System.BroadcastEvent(ev);
      Login.setMuted(newMuted, login.muted.content, ev.created_at);
    }
  }

  async function mute() {
    const pub = login?.publisher();
    if (pub) {
      const newMuted = [...tags, ["p", pubkey]];
      const ev = await pub.generic((eb) => {
        eb.kind(MUTED).content(login.muted.content);
        for (const tag of newMuted) {
          eb.tag(tag);
        }
        return eb;
      });
      console.debug(ev);
      System.BroadcastEvent(ev);
      Login.setMuted(newMuted, login.muted.content, ev.created_at);
    }
  }

  return (
    <AsyncButton
      disabled={login.muted.timestamp === 0}
      type="button"
      className="btn delete-button"
      onClick={isMuted ? unmute : mute}
    >
      {isMuted ? "Unmute" : "Mute"}
    </AsyncButton>
  );
}

export function MuteButton({ pubkey }: { pubkey: string }) {
  const login = useLogin();
  return login?.pubkey ? (
    <LoggedInMuteButton loggedIn={login.pubkey} pubkey={pubkey} />
  ) : null;
}
