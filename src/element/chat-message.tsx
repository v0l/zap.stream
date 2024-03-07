import { SnortContext, useEventReactions, useReactions, useUserProfile } from "@snort/system-react";
import { EventKind, NostrLink, TaggedNostrEvent } from "@snort/system";
import React, { Suspense, lazy, useContext, useMemo, useRef, useState } from "react";
import { useHover, useIntersectionObserver, useOnClickOutside } from "usehooks-ts";
import { dedupe } from "@snort/shared";

const EmojiPicker = lazy(() => import("./emoji-picker"));
import { Icon } from "./icon";
import { Emoji as EmojiComponent } from "./emoji";
import { Profile } from "./profile";
import { Text } from "./text";
import { useMute } from "./mute-button";
import { SendZapsDialog } from "./send-zap";
import { CollapsibleEvent } from "./collapsible";

import { useLogin } from "@/hooks/login";
import { formatSats } from "@/number";
import type { Badge, Emoji, EmojiPack } from "@/types";
import { IconButton } from "./buttons";
import Pill from "./pill";
import classNames from "classnames";

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
  emojiPacks,
  badges,
}: {
  ev: TaggedNostrEvent;
  streamer: string;
  emojiPacks: EmojiPack[];
  badges: Badge[];
}) {
  const system = useContext(SnortContext);
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useIntersectionObserver(ref, {
    freezeOnceVisible: true,
  });
  const emojiRef = useRef(null);
  const link = NostrLink.fromEvent(ev);
  const isHovering = useHover(ref);
  const { mute } = useMute(ev.pubkey);
  const [showZapDialog, setShowZapDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const login = useLogin();
  const profile = useUserProfile(inView?.isIntersecting ? ev.pubkey : undefined);
  const shouldShowMuteButton = ev.pubkey !== streamer && ev.pubkey !== login?.pubkey;
  const zapTarget = profile?.lud16 ?? profile?.lud06;
  const related = useReactions("reactions", [link], undefined, true);
  const { zaps, reactions } = useEventReactions(link, related);
  const emojiNames = emojiPacks.map(p => p.emojis).flat();

  const filteredReactions = useMemo(() => {
    return reactions.all.filter(a => link.isReplyToThis(a));
  }, [ev, reactions.all]);

  const hasReactions = filteredReactions.length > 0;
  const totalZaps = useMemo(() => {
    return zaps.filter(a => a.event?.id === ev.id).reduce((acc, z) => acc + z.amount, 0);
  }, [zaps, ev]);
  const hasZaps = totalZaps > 0;
  const awardedBadges = badges.filter(b => b.awardees.has(ev.pubkey) && b.accepted.has(ev.pubkey));

  useOnClickOutside(ref, () => {
    setShowZapDialog(false);
  });

  useOnClickOutside(emojiRef, () => {
    setShowEmojiPicker(false);
  });

  function getEmojiById(id: string) {
    return emojiNames.find(e => e.at(1) === id);
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
          reply = await pub?.generic(eb => {
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
        system.BroadcastEvent(reply);
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
      <div className="leading-6 overflow-wrap" ref={ref}>
        <Profile
          className={classNames("text-secondary inline-flex", { "!text-primary": streamer === ev.pubkey })}
          icon={
            ev.pubkey === streamer ? (
              <Icon name="signal" size={16} />
            ) : (
              awardedBadges.map(badge => {
                return (
                  <img key={badge.name} className="badge-icon" src={badge.thumb || badge.image} alt={badge.name} />
                );
              })
            )
          }
          pubkey={ev.pubkey}
        />{" "}
        <Text tags={ev.tags} content={ev.content} eventComponent={CollapsibleEvent} className="inline" />
        {(hasReactions || hasZaps) && (
          <div className="flex gap-1 mt-1">
            {hasZaps && (
              <Pill className="flex gap-1 items-center">
                <Icon name="zap-filled" size={12} className="text-zap" />
                <span className="text-xs">{formatSats(totalZaps)}</span>
              </Pill>
            )}
            {dedupe(filteredReactions.map(v => emojifyReaction(v.content))).map(e => {
              const isCustomEmojiReaction = e.length > 1 && e.startsWith(":") && e.endsWith(":");
              const emojiName = e.replace(/:/g, "");
              const emoji = isCustomEmojiReaction && getEmojiById(emojiName);
              return (
                <div className="bg-layer-2 rounded-full px-1" key={`${ev.id}-${emojiName}`}>
                  {isCustomEmojiReaction && emoji ? <EmojiComponent name={emoji[1]} url={emoji[2]} /> : e}
                </div>
              );
            })}
          </div>
        )}
        {ref.current && (
          <div
            className="fixed rounded-lg p-2 bg-layer-1 border border-layer-2 flex gap-1 z-10"
            style={{
              top: topOffset ? topOffset + 24 : 0,
              left: leftOffset ? leftOffset : 0,
              opacity: showZapDialog || isHovering ? 1 : 0,
              pointerEvents: showZapDialog || isHovering ? "auto" : "none",
            }}>
            {zapTarget && (
              <SendZapsDialog
                lnurl={zapTarget}
                eTag={ev.id}
                pubkey={ev.pubkey}
                button={
                  <IconButton iconName="zap" iconSize={14} className="p-2 rounded-full bg-layer-2 aspect-square" />
                }
                targetName={profile?.name || ev.pubkey}
              />
            )}
            <IconButton
              onClick={pickEmoji}
              iconName="face"
              iconSize={14}
              className="p-2 rounded-full bg-layer-2 aspect-square"
            />
            {shouldShowMuteButton && (
              <IconButton
                onClick={muteUser}
                iconName="user-x"
                iconSize={14}
                className="p-2 rounded-full bg-layer-2 aspect-square"
              />
            )}
          </div>
        )}
      </div>
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
    </>
  );
}
