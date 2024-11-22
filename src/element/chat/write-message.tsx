import { EventKind, NostrLink } from "@snort/system";
import React, { Suspense, lazy, useContext, useRef, useState } from "react";
import { SnortContext } from "@snort/system-react";
import { unixNowMs, unwrap } from "@snort/shared";

const EmojiPicker = lazy(() => import("../emoji-picker"));
import { useLogin } from "@/hooks/login";
import { Icon } from "../icon";
import { Textarea } from "./textarea";
import type { Emoji, EmojiPack } from "@/types";
import { LIVE_STREAM_CHAT } from "@/const";
import { TimeSync } from "@/time-sync";
import AsyncButton from "../async-button";

export function WriteMessage({
  link,
  emojiPacks,
  kind,
  relays,
}: {
  link: NostrLink;
  emojiPacks: EmojiPack[];
  kind?: EventKind;
  relays?: Array<string>;
}) {
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
        eb.kind(kind ?? (LIVE_STREAM_CHAT as EventKind))
          .content(chat)
          .createdAt(Math.floor((unixNowMs() - TimeSync) / 1000))
          .tag(unwrap(link.toEventTag("root")))
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
        for (const r of relays ?? []) {
          system.WriteOnceToRelay(r, reply);
        }
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
    if (e.code === "Enter" && !e.nativeEvent.isComposing) {
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
      <div className="grow flex bg-layer-2 px-3 py-2 rounded-xl items-center" ref={ref}>
        <Textarea
          className="!p-0 !rounded-none"
          emojis={emojis}
          value={chat}
          onKeyDown={onKeyDown}
          onChange={e => setChat(e.target.value)}
          rows={1}
        />
        <AsyncButton onClick={pickEmoji} className="px-3 opacity-80">
          <Icon name="face" />
        </AsyncButton>
        <AsyncButton onClick={sendChatMessage} className="px-3 opacity-80">
          <Icon name="send" />
        </AsyncButton>
        {showEmojiPicker && (
          <Suspense>
            <EmojiPicker
              topOffset={topOffset ?? 0}
              leftOffset={leftOffset ?? 0}
              emojiPacks={emojiPacks}
              onEmojiSelect={onEmojiSelect}
              onClickOutside={() => setShowEmojiPicker(false)}
              ref={emojiRef}
            />
          </Suspense>
        )}
      </div>
    </>
  );
}
