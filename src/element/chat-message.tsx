import { useUserProfile } from "@snort/system-react";
import { NostrEvent, parseZap, EventKind } from "@snort/system";
import React, { useRef, useState, useMemo } from "react";
import {
  useMediaQuery,
  useHover,
  useOnClickOutside,
  useIntersectionObserver,
} from "usehooks-ts";

import { EmojiPicker } from "element/emoji-picker";
import { Icon } from "element/icon";
import { Emoji as EmojiComponent } from "element/emoji";
import { Profile } from "./profile";
import { Text } from "element/text";
import { useMute } from "element/mute-button";
import { SendZapsDialog } from "element/send-zap";
import { CollapsibleEvent } from "element/collapsible";
import { useLogin } from "hooks/login";
import { formatSats } from "number";
import { findTag } from "utils";
import type { Badge, Emoji, EmojiPack } from "types";
import { System } from "index";

function emojifyReaction(reaction: string) {
  if (reaction === "+") {
    return "💜";
  }
  if (reaction === "-") {
    return "👎";
  }
  return reaction;
}

const customComponents = {
  Event: CollapsibleEvent,
};

export function ChatMessage({
  streamer,
  ev,
  reactions,
  emojiPacks,
  badges,
}: {
  ev: NostrEvent;
  streamer: string;
  reactions: readonly NostrEvent[];
  emojiPacks: EmojiPack[];
  badges: Badge[];
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useIntersectionObserver(ref, {
    freezeOnceVisible: true,
  });
  const emojiRef = useRef(null);
  const isTablet = useMediaQuery("(max-width: 1020px)");
  const isHovering = useHover(ref);
  const { mute } = useMute(ev.pubkey);
  const [showZapDialog, setShowZapDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const login = useLogin();
  const profile = useUserProfile(
    System,
    inView?.isIntersecting ? ev.pubkey : undefined
  );
  const shouldShowMuteButton =
    ev.pubkey !== streamer && ev.pubkey !== login?.pubkey;
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
  const awardedBadges = badges.filter(
    (b) => b.awardees.has(ev.pubkey) && b.accepted.has(ev.pubkey)
  );

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
      } else if (emoji.id) {
        const e = getEmojiById(emoji.id);
        if (e) {
          reply = await pub?.generic((eb) => {
            return eb
              .kind(EventKind.Reaction)
              .content(`:${emoji.id}:`)
              .tag(["e", ev.id])
              .tag(["p", ev.pubkey])
              .tag(["emoji", e[1], e[2]]);
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

  function pickEmoji(e: React.MouseEvent) {
    e.stopPropagation();
    setShowEmojiPicker(!showEmojiPicker);
  }

  function muteUser(e: React.MouseEvent) {
    e.stopPropagation();
    mute();
  }

  return (
    <>
      <div
        className={`message${streamer === ev.pubkey ? " streamer" : ""}`}
        ref={ref}
      >
        <Profile
          icon={
            ev.pubkey === streamer ? (
              <Icon name="signal" size={16} />
            ) : (
              awardedBadges.map((badge) => {
                return (
                  <img
                    key={badge.name}
                    className="badge-icon"
                    src={badge.thumb || badge.image}
                    alt={badge.name}
                  />
                );
              })
            )
          }
          pubkey={ev.pubkey}
          profile={profile}
        />
        <Text
          tags={ev.tags}
          content={ev.content}
          customComponents={customComponents}
        />
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
                      <EmojiComponent name={emoji[1]} url={emoji[2]} />
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
            {shouldShowMuteButton && (
              <button className="message-zap-button" onClick={muteUser}>
                <Icon name="user-x" className="message-zap-button-icon" />
              </button>
            )}
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
