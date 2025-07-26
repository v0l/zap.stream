import { SnortContext, useEventReactions, useReactions, useUserProfile } from "@snort/system-react";
import { EventKind, NostrLink, TaggedNostrEvent } from "@snort/system";
import React, { Suspense, lazy, useContext, useMemo, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { dedupe } from "@snort/shared";
import dayjs from "dayjs";

const EmojiPicker = lazy(() => import("../emoji-picker"));
import { Icon } from "../icon";
import { Emoji as EmojiComponent } from "../emoji";
import { Profile } from "../profile";
import { Text } from "../text";
import { useMute } from "../mute-button";
import { SendZaps } from "../send-zap";
import { CollapsibleEvent } from "../collapsible";

import { useLogin } from "@/hooks/login";
import { formatZapAmount } from "@/number";
import type { Emoji, EmojiPack } from "@/types";
import Pill from "../pill";
import classNames from "classnames";
import Modal from "../modal";
import { ChatMenu } from "./chat-menu";
import { BadgeAward } from "@/hooks/badges";
import AwardedChatBadge from "./chat-badge";

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
  badges: BadgeAward[];
}) {
  const system = useContext(SnortContext);
  const ref = useRef<HTMLDivElement | null>(null);
  const emojiRef = useRef(null);
  const link = useMemo(() => NostrLink.fromEvent(ev), [ev.id]);
  const { mute } = useMute(ev.pubkey);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [zapping, setZapping] = useState(false);
  const login = useLogin();
  const profile = useUserProfile(ev.pubkey);
  const shouldShowMuteButton = ev.pubkey !== streamer && ev.pubkey !== login?.pubkey;
  const zapTarget = profile?.lud16 ?? profile?.lud06;
  const related = useReactions(
    "reactions",
    link,
    rb => {
      rb.withOptions({
        replaceable: true,
      });
    },
    true,
  );
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
  const awardedBadges = badges.filter(b => b.awardees.has(ev.pubkey));

  useOnClickOutside(ref, () => {
    setZapping(false);
  });

  useOnClickOutside(emojiRef, () => {
    setShowEmojiPicker(false);
  });

  function getEmojiById(id: string) {
    return emojiNames.find(e => e.at(1) === id);
  }

  async function onEmojiSelect(emoji: Emoji) {
    setShowEmojiPicker(false);
    setZapping(false);
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

  function pickEmoji(e: React.MouseEvent) {
    e.stopPropagation();
    setShowEmojiPicker(!showEmojiPicker);
  }

  function muteUser(e: React.MouseEvent) {
    e.stopPropagation();
    mute();
  }

  const topOffset = ref?.current?.getBoundingClientRect().top;
  const leftOffset = ref?.current?.getBoundingClientRect().left;

  return (
    <>
      <div className="leading-6 overflow-wrap" ref={ref}>
        <Profile
          className={classNames("text-secondary inline-flex", { "!text-primary": streamer === ev.pubkey })}
          icon={
            ev.pubkey === streamer ? (
              <Icon name="signal" size={16} />
            ) : (
              awardedBadges.map(a => <AwardedChatBadge ev={a.event} pubkey={ev.pubkey} />)
            )
          }
          pubkey={ev.pubkey}
        />{" "}
        <span title={dayjs(ev.created_at * 1000).format("MMM D, h:mm A")}>
          <Text tags={ev.tags} content={ev.content} eventComponent={CollapsibleEvent} className="inline" />
        </span>
        {(hasReactions || hasZaps) && (
          <div className="flex gap-1 mt-1">
            {hasZaps && (
              <Pill className="flex gap-1 items-center">
                <Icon name="zap-filled" size={12} className="text-zap" />
                <span className="text-xs">{formatZapAmount(totalZaps)}</span>
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
        <ChatMenu
          ref={ref}
          zapTarget={zapTarget}
          onPickEmoji={pickEmoji}
          onMuteUser={muteUser}
          onZapping={() => setZapping(true)}
          showMuteButton={shouldShowMuteButton}
        />
        {zapping && zapTarget && (
          <Modal id="send-zaps" onClose={() => setZapping(false)}>
            <SendZaps
              lnurl={zapTarget}
              eTag={ev.id}
              pubkey={ev.pubkey}
              targetName={profile?.name || ev.pubkey}
              onFinish={() => setZapping(false)}
            />
          </Modal>
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
