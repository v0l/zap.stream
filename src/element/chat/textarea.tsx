import { useContext, useEffect, useState } from "react";
import ReactTextareaAutocomplete, { type TriggerType } from "@webscopeio/react-textarea-autocomplete";
import "@webscopeio/react-textarea-autocomplete/style.css";
import "./textarea.css";

import { hexToBech32, NostrPrefix } from "@snort/shared";
import { SnortContext } from "@snort/system-react";
import type { CachedMetadata } from "@snort/system";

import { Emoji } from "../emoji";
import { Avatar } from "../avatar";
import type { EmojiTag } from "@/types";

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

const UserItem = (metadata: CachedMetadata) => {
  const { pubkey, display_name, ...rest } = metadata;
  return (
    <div key={pubkey} className="user-item">
      <Avatar className="user-image" user={metadata} pubkey={pubkey} />
      <div className="user-details">{display_name || rest.name}</div>
    </div>
  );
};

type TextareaProps = { emojis: EmojiTag[] } & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ emojis, ...props }: TextareaProps) {
  const system = useContext(SnortContext);
  const [ref, setRef] = useState<HTMLTextAreaElement | null>(null);
  const userDataProvider = async (token: string) => {
    const cache = system.profileLoader.cache;
    return await cache.search(token);
  };

  useEffect(() => {
    if (ref) {
      ref.style.height = "";
      ref.style.height = `${Math.min(ref.scrollHeight, 200)}px`;
    }
  }, [ref, props.value]);

  const emojiDataProvider = (token: string) => {
    const results = emojis
      .map(t => {
        return {
          name: t.at(1) || "",
          url: t.at(2) || "",
        };
      })
      .filter(({ name }) => name.toLowerCase().includes(token.toLowerCase()));
    return results.slice(0, 5);
  };

  const trigger = {
    ":": {
      dataProvider: emojiDataProvider,
      component: EmojiItem,
      output: (item: EmojiItemProps) => `:${item.name}:`,
    },
    "@": {
      afterWhitespace: true,
      dataProvider: userDataProvider,
      component: (props: { entity: CachedMetadata }) => <UserItem {...props.entity} />,
      output: (item: { pubkey: string }) => `@${hexToBech32(NostrPrefix.PublicKey, item.pubkey)}`,
    },
  } as TriggerType<string | object>;

  return (
    <ReactTextareaAutocomplete
      dir="auto"
      loadingComponent={() => <span>Loading...</span>}
      placeholder="Message"
      autoFocus={false}
      trigger={trigger}
      {...props}
      innerRef={r => setRef(r)}
    />
  );
}
