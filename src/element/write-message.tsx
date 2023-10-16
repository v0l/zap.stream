import { NostrLink, EventKind } from "@snort/system";
import React, { useContext, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";

import { useLogin } from "hooks/login";
import AsyncButton from "element/async-button";
import { Icon } from "element/icon";
import { Textarea } from "element/textarea";
import { EmojiPicker } from "element/emoji-picker";
import type { EmojiPack, Emoji } from "types";
import { LIVE_STREAM_CHAT } from "const";
import { SnortContext } from "@snort/system-react";

export function WriteMessage({ link, emojiPacks }: { link: NostrLink; emojiPacks: EmojiPack[] }) {
  const system = useContext(SnortContext);
  const ref = useRef<HTMLDivElement | null>(null);
  const emojiRef = useRef(null);
  const [chat, setChat] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const login = useLogin();
  const emojis = emojiPacks.map(pack => pack.emojis).flat();
  const names = emojis.map(t => t.at(1));

  const topOffset = ref.current?.getBoundingClientRect().top;
  const leftOffset = ref.current?.getBoundingClientRect().left;

  async function sendChatMessage() {
    const pub = login?.publisher();
    if (chat.length > 1) {
      const emojiNames = new Set();

      for (const name of names) {
        if (chat.includes(`:${name}:`)) {
          emojiNames.add(name);
        }
      }

      const reply = await pub?.generic(eb => {
        const emoji = [...emojiNames].map(name => emojis.find(e => e.at(1) === name));
        eb.kind(LIVE_STREAM_CHAT as EventKind)
          .content(chat)
          .tag(["a", `${link.kind}:${link.author}:${link.id}`, "", "root"])
          .processContent();
        for (const e of emoji) {
          if (e) {
            eb.tag(e);
          }
        }
        return eb;
      });
      if (reply) {
        console.debug(reply);
        system.BroadcastEvent(reply);
      }
      setChat("");
    }
  }

  function onEmojiSelect(emoji: Emoji) {
    if (emoji.native) {
      setChat(`${chat}${emoji.native}`);
    } else {
      setChat(`${chat}:${emoji.id}:`);
    }
    setShowEmojiPicker(false);
  }

  async function onKeyDown(e: React.KeyboardEvent) {
    if (e.code === "Enter") {
      e.preventDefault();
      await sendChatMessage();
    }
  }

  function pickEmoji(ev: React.MouseEvent) {
    ev.stopPropagation();
    setShowEmojiPicker(!showEmojiPicker);
  }

  return (
    <>
      <div className="paper" ref={ref}>
        <Textarea emojis={emojis} value={chat} onKeyDown={onKeyDown} onChange={e => setChat(e.target.value)} />
        <div onClick={pickEmoji}>
          <Icon name="face" className="write-emoji-button" />
        </div>
        {showEmojiPicker && (
          <EmojiPicker
            topOffset={topOffset ?? 0}
            leftOffset={leftOffset ?? 0}
            emojiPacks={emojiPacks}
            onEmojiSelect={onEmojiSelect}
            onClickOutside={() => setShowEmojiPicker(false)}
            ref={emojiRef}
          />
        )}
      </div>
      <AsyncButton onClick={sendChatMessage} className="btn btn-border">
        <FormattedMessage defaultMessage="Send" />
      </AsyncButton>
    </>
  );
}
