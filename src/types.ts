export interface RelaySettings {
  read: boolean;
  write: boolean;
}

export interface Relays {
  [key: string]: RelaySettings;
}

export type Tag = string[];

export type Tags = Tag[];

export type EmojiTag = ["emoji", string, string];

export interface Emoji {
  native?: string;
  id?: string;
}

export interface EmojiPack {
  address: string;
  name: string;
  author: string;
  emojis: EmojiTag[];
}
