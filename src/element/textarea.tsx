import "./textarea.css";
import ReactTextareaAutocomplete from "@webscopeio/react-textarea-autocomplete";
import "@webscopeio/react-textarea-autocomplete/style.css";
import type { KeyboardEvent, ChangeEvent } from "react";
import { Emoji, type EmojiTag } from "./emoji";
import uniqWith from "lodash/uniqWith";
import isEqual from "lodash/isEqual";

interface EmojiItemProps {
  name: string;
  url: string;
}

const EmojiItem = ({ entity: { name, url } }: { entity: EmojiItemProps }) => {
  return (
    <div className="emoji-item">
      <div className="emoji-image">
        <Emoji name={name} url={url} />
      </div>
      <div className="emoji-name">{name}</div>
    </div>
  );
};

interface TextareaProps {
  emojis: EmojiTag[];
  value: string;
  onChange: (e: ChangeEvent<Element>) => void;
  onKeyDown: (e: KeyboardEvent<Element>) => void;
}

export function Textarea({ emojis, ...props }: TextareaProps) {
  const emojiDataProvider = async (token: string) => {
    const results = emojis
      .map((t) => {
        return {
          name: t.at(1) || "",
          url: t.at(2) || "",
        };
      })
      .filter(({ name }) => name.toLowerCase().includes(token.toLowerCase()));
    return uniqWith(results, isEqual).slice(0, 5);
  };
  const trigger = {
    ":": {
      dataProvider: emojiDataProvider,
      component: EmojiItem,
      output: (item: EmojiItemProps) => `:${item.name}:`,
    },
  };

  return (
    <ReactTextareaAutocomplete
      dir="auto"
      loadingComponent={() => <span>Loading...</span>}
      placeholder="Message"
      autoFocus={false}
      // @ts-expect-error
      trigger={trigger}
      {...props}
    />
  );
}
