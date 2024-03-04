import { useContext, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { SnortContext } from "@snort/system-react";

import { useLogin } from "@/hooks/login";
import { Login } from "@/login";
import { MUTED } from "@/const";
import { DefaultButton } from "./buttons";

export function useMute(pubkey: string) {
  const system = useContext(SnortContext);
  const login = useLogin();
  const { tags, content } = login?.muted ?? { tags: [] };
  const muted = useMemo(() => tags.filter(t => t.at(0) === "p"), [tags]);
  const isMuted = useMemo(() => muted.find(t => t.at(1) === pubkey), [pubkey, muted]);

  async function unmute() {
    const pub = login?.publisher();
    if (pub) {
      const newMuted = tags.filter(t => t.at(1) !== pubkey);
      const ev = await pub.generic(eb => {
        eb.kind(MUTED).content(content ?? "");
        for (const t of newMuted) {
          eb.tag(t);
        }
        return eb;
      });
      console.debug(ev);
      await system.BroadcastEvent(ev);
      Login.setMuted(newMuted, content ?? "", ev.created_at);
    }
  }

  async function mute() {
    const pub = login?.publisher();
    if (pub) {
      const newMuted = [...tags, ["p", pubkey]];
      const ev = await pub.generic(eb => {
        eb.kind(MUTED).content(content ?? "");
        for (const tag of newMuted) {
          eb.tag(tag);
        }
        return eb;
      });
      console.debug(ev);
      await system.BroadcastEvent(ev);
      Login.setMuted(newMuted, content ?? "", ev.created_at);
    }
  }

  return { isMuted, mute, unmute };
}

export function LoggedInMuteButton({ pubkey }: { pubkey: string }) {
  const { isMuted, mute, unmute } = useMute(pubkey);

  return (
    <DefaultButton onClick={() => (isMuted ? unmute() : mute())}>
      {isMuted ? (
        <FormattedMessage defaultMessage="Unmute" id="W9355R" />
      ) : (
        <FormattedMessage defaultMessage="Mute" id="x82IOl" />
      )}
    </DefaultButton>
  );
}

export function MuteButton({ pubkey }: { pubkey: string }) {
  const login = useLogin();
  return login?.pubkey ? <LoggedInMuteButton pubkey={pubkey} /> : null;
}
