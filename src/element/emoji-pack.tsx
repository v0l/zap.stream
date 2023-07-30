import "./emoji-pack.css";
import { type NostrEvent } from "@snort/system";
import { unixNow } from "@snort/shared";

import AsyncButton from "element/async-button";
import { useLogin } from "hooks/login";
import { toEmojiPack } from "hooks/emoji";
import { Mention } from "element/mention";
import { findTag } from "utils";
import { USER_EMOJIS } from "const";
import { Login, System } from "index";

export function EmojiPack({ ev }: { ev: NostrEvent }) {
  const login = useLogin();
  const name = findTag(ev, "d");
  const isUsed = login.emojis.find(
    (e) => e.author === ev.pubkey && e.name === name,
  );
  const emoji = ev.tags.filter((e) => e.at(0) === "emoji");

  async function toggleEmojiPack() {
    let newPacks = [];
    if (isUsed) {
      newPacks = login.emojis.filter(
        (e) => e.pubkey !== ev.pubkey && e.name !== name,
      );
    } else {
      newPacks = [...login.emojis, toEmojiPack(ev)];
    }
    const pub = login?.publisher();
    if (pub) {
      const ev = await pub.generic((eb) => {
        eb.kind(USER_EMOJIS).content("");
        for (const e of newPacks) {
          eb.tag(["a", e.address]);
        }
        return eb;
      });
      console.debug(ev);
      System.BroadcastEvent(ev);
      Login.setEmojis(newPacks, unixNow());
    }
  }

  return (
    <div className="emoji-pack">
      <div className="emoji-pack-title">
        <div>
          <h4>{name}</h4>
          <Mention pubkey={ev.pubkey} />
        </div>
        <AsyncButton
          className={`btn btn-primary ${isUsed ? "delete-button" : ""}`}
          onClick={toggleEmojiPack}
        >
          {isUsed ? "Remove" : "Add"}
        </AsyncButton>
      </div>
      <div className="emoji-pack-emojis">
        {emoji.map((e) => {
          const [, name, image] = e;
          return (
            <div className="emoji-definition">
              <img alt={name} className="emoji" src={image} />
              <span className="emoji-name">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
