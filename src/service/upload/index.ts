import { Nip94Tags, NostrEvent } from "@snort/system";

export const FileExtensionRegex = /\.([\w]{1,7})$/i;

export interface UploadResult {
  url?: string;
  error?: string;

  /**
   * NIP-94 File Header
   */
  header?: NostrEvent;

  /**
   * Media metadata
   */
  metadata?: Nip94Tags;
}