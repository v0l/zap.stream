import "./emoji-pack.css";
import { EventKind, NostrLink, type NostrEvent } from "@snort/system";
import { FormattedMessage } from "react-intl";

import { useLogin } from "@/hooks/login";
import useEmoji from "@/hooks/emoji";
import { DefaultButton, WarningButton } from "./buttons";

export function EmojiPack({ ev }: { ev: NostrEvent }) {
  const login = useLogin();
  const link = NostrLink.fromEvent(ev);
  const name = link.id;
  const emojis = useEmoji(login?.pubkey);
  const isUsed = emojis.find(e => e.author === link.author && e.name === link.id);
  const emoji = ev.tags.filter(e => e.at(0) === "emoji");

  async function toggleEmojiPack() {
    if (isUsed) {
      await login?.state?.removeFromList(EventKind.EmojisList, link, true);
    } else {
      await login?.state?.addToList(EventKind.EmojisList, link, true);
    }
  }

  return (
    <div className="emoji-pack">
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
            <div className="emoji-definition" key={name}>
              <img alt={name} className="custom-emoji" src={image} />
              <span className="emoji-name">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
