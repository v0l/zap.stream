import { useUserProfile } from "@snort/system-react";
import { NostrEvent, parseZap, EventKind } from "@snort/system";
import React, { useRef, useState, useMemo } from "react";
import {
  useMediaQuery,
  useHover,
  useOnClickOutside,
  useIntersectionObserver,
} from "usehooks-ts";

import { System } from "../index";
import { formatSats } from "../number";
import { EmojiPicker } from "./emoji-picker";
import { Icon } from "./icon";
import { Emoji } from "./emoji";
import { Profile } from "./profile";
import { Text } from "./text";
import { SendZapsDialog } from "./send-zap";
import { findTag } from "../utils";
import type { EmojiPack } from "../hooks/emoji";
import { useLogin } from "../hooks/login";

interface Emoji {
  id: string;
  native?: string;
}

function emojifyReaction(reaction: string) {
  if (reaction === "+") {
    return "💜";
  }
  if (reaction === "-") {
    return "👎";
  }
  return reaction;
}

export function ChatMessage({
  streamer,
  ev,
  reactions,
  emojiPacks,
}: {
  ev: NostrEvent;
  streamer: string;
  reactions: readonly NostrEvent[];
  emojiPacks: EmojiPack[];
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useIntersectionObserver(ref, {
    freezeOnceVisible: true,
  });
  const emojiRef = useRef(null);
  const isTablet = useMediaQuery("(max-width: 1020px)");
  const isHovering = useHover(ref);
  const [showZapDialog, setShowZapDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const login = useLogin();
  const profile = useUserProfile(
    System,
    inView?.isIntersecting ? ev.pubkey : undefined
  );
  const zapTarget = profile?.lud16 ?? profile?.lud06;
  const zaps = useMemo(() => {
    return reactions
      .filter((a) => a.kind === EventKind.ZapReceipt)
      .map((a) => parseZap(a, System.ProfileLoader.Cache))
      .filter((a) => a && a.valid);
  }, [reactions]);
  const emojiReactions = useMemo(() => {
    const emojified = reactions
      .filter((e) => e.kind === EventKind.Reaction && findTag(e, "e") === ev.id)
      .map((ev) => emojifyReaction(ev.content));
    return [...new Set(emojified)];
  }, [ev, reactions]);
  const emojiNames = emojiPacks.map((p) => p.emojis).flat();

  const hasReactions = emojiReactions.length > 0;
  const totalZaps = useMemo(() => {
    const messageZaps = zaps.filter((z) => z.event === ev.id);
    return messageZaps.reduce((acc, z) => acc + z.amount, 0);
  }, [zaps, ev]);
  const hasZaps = totalZaps > 0;

  useOnClickOutside(ref, () => {
    setShowZapDialog(false);
  });

  useOnClickOutside(emojiRef, () => {
    setShowEmojiPicker(false);
  });

  function getEmojiById(id: string) {
    return emojiNames.find((e) => e.at(1) === id);
  }

  async function onEmojiSelect(emoji: Emoji) {
    setShowEmojiPicker(false);
    setShowZapDialog(false);
    let reply = null;
    try {
      const pub = login?.publisher();
      if (emoji.native) {
        reply = await pub?.react(ev, emoji.native || "+1");
      } else {
        const e = getEmojiById(emoji.id);
        if (e) {
          reply = await pub?.generic((eb) => {
            return eb
              .kind(EventKind.Reaction)
              .content(`:${emoji.id}:`)
              .tag(["e", ev.id])
              .tag(["p", ev.pubkey])
              .tag(["emoji", e.at(1)!, e.at(2)!]);
          });
        }
      }
      if (reply) {
        console.debug(reply);
        System.BroadcastEvent(reply);
      }
    } catch {
      //ignore
    }
  }

  const topOffset = ref.current?.getBoundingClientRect().top;
  const leftOffset = ref.current?.getBoundingClientRect().left;

  function pickEmoji(ev: React.MouseEvent) {
    ev.stopPropagation();
    setShowEmojiPicker(!showEmojiPicker);
  }

  return (
    <>
      <div
        className={`message${streamer === ev.pubkey ? " streamer" : ""}`}
        ref={ref}
        onClick={() => setShowZapDialog(true)}
      >
        <Profile
          icon={ev.pubkey === streamer && <Icon name="signal" size={16} />}
          pubkey={ev.pubkey}
          profile={profile}
        />
        <Text content={ev.content} tags={ev.tags} />
        {(hasReactions || hasZaps) && (
          <div className="message-reactions">
            {hasZaps && (
              <div className="zap-pill">
                <Icon name="zap-filled" className="zap-pill-icon" />
                <span className="zap-pill-amount">{formatSats(totalZaps)}</span>
              </div>
            )}
            {emojiReactions.map((e) => {
              const isCustomEmojiReaction =
                e.length > 1 && e.startsWith(":") && e.endsWith(":");
              const emojiName = e.replace(/:/g, "");
              const emoji = isCustomEmojiReaction && getEmojiById(emojiName);
              return (
                <div className="message-reaction-container">
                  {isCustomEmojiReaction && emoji ? (
                    <span className="message-reaction">
                      <Emoji name={emoji.at(1)!} url={emoji.at(2)!} />
                    </span>
                  ) : (
                    <span className="message-reaction">{e}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {ref.current && (
          <div
            className="message-zap-container"
            style={
              isTablet
                ? {
                  display: showZapDialog || isHovering ? "flex" : "none",
                }
                : {
                  position: "fixed",
                  top: topOffset ? topOffset - 12 : 0,
                  left: leftOffset ? leftOffset - 32 : 0,
                  opacity: showZapDialog || isHovering ? 1 : 0,
                  pointerEvents:
                    showZapDialog || isHovering ? "auto" : "none",
                }
            }
          >
            {zapTarget && (
              <SendZapsDialog
                lnurl={zapTarget}
                eTag={ev.id}
                pubkey={ev.pubkey}
                button={
                  <button className="message-zap-button">
                    <Icon name="zap" className="message-zap-button-icon" />
                  </button>
                }
                targetName={profile?.name || ev.pubkey}
              />
            )}
            <button className="message-zap-button" onClick={pickEmoji}>
              <Icon name="face" className="message-zap-button-icon" />
            </button>
          </div>
        )}
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
    </>
  );
}
