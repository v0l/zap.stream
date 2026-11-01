/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="@webbtc/webln-types" />
/// <reference types="vite/client" />

declare const __ZAP_STREAM_VERSION__: string

declare module "*.md" {
  const value: string
  export default value
}

declare module "translations/*.json" {
  const value: Record<string, string>
  export default value
}

// light-bolt11-decoder is a direct devDependency now — its own type
// declarations (including Section) are used; no ambient declaration needed.
