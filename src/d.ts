/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="@webbtc/webln-types" />
/// <reference types="vite/client" />

declare const __ZAP_STREAM_VERSION__: string;

declare module "*.md" {
  const value: string;
  export default value;
}

declare module "translations/*.json" {
  const value: Record<string, string>;
  export default value;
}

declare module "light-bolt11-decoder" {
  export function decode(pr?: string): ParsedInvoice;

  export interface ParsedInvoice {
    paymentRequest: string;
    sections: Section[];
  }

  export interface Section {
    name: string;
    value: string | Uint8Array | number | undefined;
  }
}
