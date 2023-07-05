import {NostrLink, EventPublisher, EventKind} from "@snort/system";
import { useRef, useState, ChangeEvent } from "react";

import { LIVE_STREAM_CHAT } from "../const";
import useEmoji from "../hooks/emoji";
import { useLogin } from "../hooks/login";
import { System } from "../index";
import AsyncButton from "./async-button";
import { Icon } from "./icon";
import { Textarea } from "./textarea";
import { EmojiPicker } from "./emoji-picker";

interface Emoji {
    id: string;
    native?: string;
}

export function WriteMessage({ link }: { link: NostrLink }) {
    const ref = useRef(null);
    const emojiRef = useRef(null);
    const [chat, setChat] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const login = useLogin();
    const userEmojiPacks = useEmoji(login!.pubkey);
    const userEmojis = userEmojiPacks.map((pack) => pack.emojis).flat();
    const channelEmojiPacks = useEmoji(link.author!);
    const channelEmojis = channelEmojiPacks.map((pack) => pack.emojis).flat();
    const emojis = userEmojis.concat(channelEmojis);
    const names = emojis.map((t) => t.at(1));
    const allEmojiPacks = userEmojiPacks.concat(channelEmojiPacks);
    // @ts-expect-error
    const topOffset = ref.current?.getBoundingClientRect().top;
    // @ts-expect-error
    const leftOffset = ref.current?.getBoundingClientRect().left;
  
    async function sendChatMessage() {
      const pub = await EventPublisher.nip7();
      if (chat.length > 1) {
        let emojiNames = new Set();
  
        for (const name of names) {
          if (chat.includes(`:${name}:`)) {
            emojiNames.add(name);
          }
        }
  
        const reply = await pub?.generic((eb) => {
          const emoji = [...emojiNames].map((name) =>
            emojis.find((e) => e.at(1) === name)
          );
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
          System.BroadcastEvent(reply);
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
  
    async function onChange(e: ChangeEvent) {
      // @ts-expect-error
      setChat(e.target.value);
    }
  
    function pickEmoji(ev: any) {
      ev.stopPropagation();
      setShowEmojiPicker(!showEmojiPicker);
    }
  
    return (
      <>
        <div className="paper" ref={ref}>
          <Textarea
            emojis={emojis}
            value={chat}
            onKeyDown={onKeyDown}
            onChange={onChange}
          />
          <div onClick={pickEmoji}>
            <Icon name="face" className="write-emoji-button" />
          </div>
          {showEmojiPicker && (
            <EmojiPicker
              topOffset={topOffset}
              leftOffset={leftOffset}
              emojiPacks={allEmojiPacks}
              onEmojiSelect={onEmojiSelect}
              onClickOutside={() => setShowEmojiPicker(false)}
              ref={emojiRef}
            />
          )}
        </div>
        <AsyncButton onClick={sendChatMessage} className="btn btn-border">
          Send
        </AsyncButton>
      </>
    );
  }
  