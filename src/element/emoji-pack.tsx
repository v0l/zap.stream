import "./emoji-pack.css";
import { type NostrEvent } from "@snort/system";

import { Mention } from "element/mention";
import { findTag } from "utils";

export function EmojiPack({ ev }: { ev: NostrEvent }) {
  const name = findTag(ev, "d");
  const emoji = ev.tags.filter((e) => e.at(0) === "emoji");
  return (
    <div className="emoji-pack">
      <div className="emoji-pack-title">
        <h4>{name}</h4>
        <Mention pubkey={ev.pubkey} />
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
