import "./emoji-pack.css";
import { type NostrEvent } from "@snort/system";
import { FormattedMessage } from "react-intl";
import { useContext } from "react";
import { SnortContext } from "@snort/system-react";

import { useLogin } from "@/hooks/login";
import { toEmojiPack } from "@/hooks/emoji";
import { findTag } from "@/utils";
import { USER_EMOJIS } from "@/const";
import { Login } from "@/index";
import type { EmojiPack as EmojiPackType } from "@/types";
import { DefaultButton, WarningButton } from "./buttons";

export function EmojiPack({ ev }: { ev: NostrEvent }) {
  const system = useContext(SnortContext);
  const login = useLogin();
  const name = findTag(ev, "d");
  const isUsed = login?.emojis.find(e => e.author === ev.pubkey && e.name === name);
  const emoji = ev.tags.filter(e => e.at(0) === "emoji");

  async function toggleEmojiPack() {
    let newPacks = [] as EmojiPackType[];
    if (isUsed) {
      newPacks = login?.emojis.filter(e => e.author !== ev.pubkey && e.name !== name) ?? [];
    } else {
      newPacks = [...(login?.emojis ?? []), toEmojiPack(ev)];
    }
    const pub = login?.publisher();
    if (pub) {
      const ev = await pub.generic(eb => {
        eb.kind(USER_EMOJIS).content("");
        for (const e of newPacks) {
          eb.tag(["a", e.address]);
        }
        return eb;
      });
      console.debug(ev);
      await system.BroadcastEvent(ev);
      Login.setEmojis(newPacks);
    }
  }

  return (
    <div className="outline emoji-pack">
      <div className="emoji-pack-title">
        <h4>{name}</h4>
        {login?.pubkey &&
          (isUsed ? (
            <WarningButton onClick={toggleEmojiPack}>
              <FormattedMessage defaultMessage="Remove" id="G/yZLu" />
            </WarningButton>
          ) : (
            <DefaultButton onClick={toggleEmojiPack}>
              <FormattedMessage defaultMessage="Add" id="2/2yg+" />
            </DefaultButton>
          ))}
      </div>
      <div className="emoji-pack-emojis">
        {emoji.map(e => {
          const [, name, image] = e;
          return (
            <div className="emoji-definition">
              <img alt={name} className="custom-emoji" src={image} />
              <span className="emoji-name">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
