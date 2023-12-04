import data, { Emoji } from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { RefObject } from "react";
import { EmojiPack } from "@/types";

interface EmojiPickerProps {
  topOffset: number;
  leftOffset: number;
  emojiPacks?: EmojiPack[];
  onEmojiSelect: (e: Emoji) => void;
  onClickOutside: () => void;
  height?: number;
  ref: RefObject<HTMLDivElement>;
}

export function EmojiPicker({
  topOffset,
  leftOffset,
  onEmojiSelect,
  onClickOutside,
  emojiPacks = [],
  height = 300,
  ref,
}: EmojiPickerProps) {
  const customEmojiList = emojiPacks.map(pack => {
    return {
      id: pack.address,
      name: pack.name,
      emojis: pack.emojis.map(e => {
        const [, name, url] = e;
        return {
          id: name,
          name,
          skins: [{ src: url }],
        };
      }),
    };
  });
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: topOffset - height - 10,
          left: leftOffset,
          zIndex: 1,
        }}
        ref={ref}>
        <style>
          {`
              em-emoji-picker { max-height: ${height}px; }
              `}
        </style>
        <Picker
          autoFocus
          data={data}
          custom={customEmojiList}
          perLine={7}
          previewPosition="none"
          skinTonePosition="search"
          theme="dark"
          onEmojiSelect={onEmojiSelect}
          onClickOutside={onClickOutside}
          maxFrequentRows={0}
        />
      </div>
    </>
  );
}
