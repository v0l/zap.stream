import "./textarea.css";
import type { KeyboardEvent, ChangeEvent } from "react";
import ReactTextareaAutocomplete, { TriggerType } from "@webscopeio/react-textarea-autocomplete";
import "@webscopeio/react-textarea-autocomplete/style.css";
import uniqWith from "lodash/uniqWith";
import isEqual from "lodash/isEqual";

import { MetadataCache, NostrPrefix, UserProfileCache } from "@snort/system";

import { Emoji } from "element/emoji";
import { Avatar } from "element/avatar";
import { hexToBech32 } from "utils";
import type { EmojiTag } from "types";
import { System } from "index";

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

const UserItem = (metadata: MetadataCache) => {
  const { pubkey, display_name, ...rest } = metadata;
  return (
    <div key={pubkey} className="user-item">
      <Avatar avatarClassname="user-image" user={metadata} />
      <div className="user-details">{display_name || rest.name}</div>
    </div>
  );
};

interface TextareaProps {
  emojis: EmojiTag[];
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: KeyboardEvent<Element>) => void;
  rows?: number;
}

export function Textarea({ emojis, ...props }: TextareaProps) {
  const userDataProvider = async (token: string) => {
    const cache = System.ProfileLoader.Cache;
    if (cache instanceof UserProfileCache) {
      return await cache.search(token);
    }
  };

  const emojiDataProvider = (token: string) => {
    const results = emojis
      .map(t => {
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
    "@": {
      afterWhitespace: true,
      dataProvider: userDataProvider,
      component: (props: { entity: MetadataCache }) => <UserItem {...props.entity} />,
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
    />
  );
}
