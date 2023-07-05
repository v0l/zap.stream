import { useUserProfile } from "@snort/system-react";
import { NostrEvent, parseZap, EventPublisher, EventKind } from "@snort/system";
import { useRef, useState, useMemo } from "react";
import { useMediaQuery, useHover, useOnClickOutside } from "usehooks-ts";

import { System } from "../index";
import { formatSats } from "../number";
import { EmojiPicker } from "./emoji-picker";
import { Icon } from "./icon";
import { Profile } from "./profile";
import { Text } from "./text";
import { SendZapsDialog } from "./send-zap";
import { findTag } from "../utils";

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
}: {
    ev: NostrEvent;
    streamer: string;
    reactions: readonly NostrEvent[];
}) {
    const ref = useRef(null);
    const emojiRef = useRef(null);
    const isTablet = useMediaQuery("(max-width: 1020px)");
    const isHovering = useHover(ref);
    const [showZapDialog, setShowZapDialog] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const profile = useUserProfile(System, ev.pubkey);
    const zapTarget = profile?.lud16 ?? profile?.lud06;
    const zaps = useMemo(() => {
        return reactions.filter(a => a.kind === EventKind.ZapReceipt)
            .map(a => parseZap(a, System.ProfileLoader.Cache))
            .filter(a => a && a.valid);
    }, [reactions])
    const emojis = useMemo(() => {
        const emojified = reactions
            .filter((e) => e.kind === EventKind.Reaction && findTag(e, "e") === ev.id)
            .map((ev) => emojifyReaction(ev.content));
        return [...new Set(emojified)];
    }, [ev, reactions]);

    const hasReactions = emojis.length > 0;
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

    async function onEmojiSelect(emoji: Emoji) {
        setShowEmojiPicker(false);
        setShowZapDialog(false);
        try {
            const pub = await EventPublisher.nip7();
            const reply = await pub?.react(ev, emoji.native || "+1");
            if (reply) {
                console.debug(reply);
                System.BroadcastEvent(reply);
            }
        } catch (error) { }
    }

    // @ts-expect-error
    const topOffset = ref.current?.getBoundingClientRect().top;
    // @ts-expect-error
    const leftOffset = ref.current?.getBoundingClientRect().left;

    function pickEmoji(ev: any) {
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
                    icon={
                        ev.pubkey === streamer && (
                            <Icon name="signal" size={16} />
                        )
                    }
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
                        {emojis.map((e) => (
                            <div className="message-reaction-container">
                                <span className="message-reaction">{e}</span>
                            </div>
                        ))}
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
                                    top: topOffset - 12,
                                    left: leftOffset - 32,
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
                    topOffset={topOffset}
                    leftOffset={leftOffset}
                    onEmojiSelect={onEmojiSelect}
                    onClickOutside={() => setShowEmojiPicker(false)}
                    ref={emojiRef}
                />
            )}
        </>
    );
}
