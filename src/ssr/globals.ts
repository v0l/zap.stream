const g = globalThis as Record<string, unknown>;

const noop = () => {};
const storage = { getItem: () => null, setItem: noop, removeItem: noop };

if (typeof g.console === "undefined") g.console = { log: noop, warn: noop, error: noop, info: noop, debug: noop };
if (typeof g.localStorage === "undefined") g.localStorage = storage;
if (typeof g.setTimeout === "undefined") g.setTimeout = () => 0;
if (typeof g.clearTimeout === "undefined") g.clearTimeout = noop;
if (typeof g.setInterval === "undefined") g.setInterval = () => 0;
if (typeof g.clearInterval === "undefined") g.clearInterval = noop;
if (typeof g.queueMicrotask === "undefined") g.queueMicrotask = (f: () => void) => Promise.resolve().then(f);
if (typeof g.MessageChannel === "undefined") {
  g.MessageChannel = class {
    port1: { onmessage?: () => void } = {};
    port2 = { postMessage: () => this.port1.onmessage?.() };
  };
}

function encodeUtf8(input: string): Uint8Array {
  const out: number[] = [];
  for (const ch of input) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(out);
}

function decodeUtf8(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i++];
    let c = b;
    if (b >= 0xf0) c = ((b & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    else if (b >= 0xe0) c = ((b & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    else if (b >= 0xc0) c = ((b & 31) << 6) | (bytes[i++] & 63);
    out += String.fromCodePoint(c);
  }
  return out;
}

if (typeof g.TextEncoder === "undefined") {
  g.TextEncoder = class {
    encoding = "utf-8";
    encode(s = "") {
      return encodeUtf8(s);
    }
  };
}
if (typeof g.TextDecoder === "undefined") {
  g.TextDecoder = class {
    encoding = "utf-8";
    decode(b?: ArrayBufferView | ArrayBuffer) {
      if (!b) return "";
      return decodeUtf8(b instanceof ArrayBuffer ? new Uint8Array(b) : new Uint8Array(b.buffer, b.byteOffset, b.byteLength));
    }
  };
}

class MiniSearchParams {
  #pairs: [string, string][] = [];
  constructor(search = "") {
    for (const part of search.replace(/^\?/, "").split("&")) {
      if (!part) continue;
      const [k, v = ""] = part.split("=");
      this.#pairs.push([decodeURIComponent(k), decodeURIComponent(v.replace(/\+/g, " "))]);
    }
  }
  get(name: string) {
    return this.#pairs.find(([k]) => k === name)?.[1] ?? null;
  }
  getAll(name: string) {
    return this.#pairs.filter(([k]) => k === name).map(([, v]) => v);
  }
  has(name: string) {
    return this.#pairs.some(([k]) => k === name);
  }
  toString() {
    return this.#pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  }
  [Symbol.iterator]() {
    return this.#pairs[Symbol.iterator]();
  }
}

class MiniURL {
  protocol = "";
  host = "";
  hostname = "";
  port = "";
  pathname = "/";
  search = "";
  hash = "";
  searchParams: MiniSearchParams;
  constructor(href: string, base?: string) {
    let rest = href;
    const abs = /^([a-z][a-z0-9+.-]*:)\/\/([^/?#]*)(.*)$/i.exec(rest);
    if (abs) {
      this.protocol = abs[1];
      this.host = abs[2];
      rest = abs[3];
    } else if (base) {
      const b = new MiniURL(base);
      this.protocol = b.protocol;
      this.host = b.host;
      if (!rest.startsWith("/")) rest = `${b.pathname.replace(/[^/]*$/, "")}${rest}`;
    }
    const [hostName, port = ""] = this.host.split(":");
    this.hostname = hostName;
    this.port = port;
    const hashAt = rest.indexOf("#");
    if (hashAt >= 0) {
      this.hash = rest.slice(hashAt);
      rest = rest.slice(0, hashAt);
    }
    const queryAt = rest.indexOf("?");
    if (queryAt >= 0) {
      this.search = rest.slice(queryAt);
      rest = rest.slice(0, queryAt);
    }
    this.pathname = rest || "/";
    this.searchParams = new MiniSearchParams(this.search);
  }
  get origin() {
    return `${this.protocol}//${this.host}`;
  }
  get href() {
    return `${this.origin}${this.pathname}${this.search}${this.hash}`;
  }
  toString() {
    return this.href;
  }
}

if (typeof g.URL === "undefined") g.URL = MiniURL;
if (typeof g.URLSearchParams === "undefined") g.URLSearchParams = MiniSearchParams;

if (typeof g.crypto === "undefined") {
  g.crypto = {
    getRandomValues<T extends ArrayBufferView>(arr: T): T {
      const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
      return arr;
    },
  };
}

if (typeof g.Intl === "undefined") {
  const group = (n: number, max = 3) => {
    const [int, frac = ""] = Math.abs(n).toFixed(max).split(".");
    const trimmed = frac.replace(/0+$/, "");
    const body = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${n < 0 ? "-" : ""}${body}${trimmed ? `.${trimmed}` : ""}`;
  };
  class NumberFormat {
    options: { maximumFractionDigits?: number };
    constructor(_locale?: unknown, options: { maximumFractionDigits?: number } = {}) {
      this.options = options;
    }
    format(n: number) {
      return group(n, this.options.maximumFractionDigits ?? 3);
    }
    formatToParts(n: number) {
      return [{ type: "literal", value: this.format(n) }];
    }
    resolvedOptions() {
      return { locale: "en" };
    }
    static supportedLocalesOf() {
      return ["en"];
    }
  }
  class PluralRules {
    options: { type?: string };
    constructor(_locale?: unknown, options: { type?: string } = {}) {
      this.options = options;
    }
    select(n: number) {
      if (this.options.type === "ordinal") {
        const t = n % 10;
        const h = n % 100;
        if (t === 1 && h !== 11) return "one";
        if (t === 2 && h !== 12) return "two";
        if (t === 3 && h !== 13) return "few";
        return "other";
      }
      return n === 1 ? "one" : "other";
    }
    resolvedOptions() {
      return { locale: "en" };
    }
    static supportedLocalesOf() {
      return ["en"];
    }
  }
  class DateTimeFormat {
    format(d: Date | number) {
      return new Date(d).toISOString();
    }
    formatToParts(d: Date | number) {
      return [{ type: "literal", value: this.format(d) }];
    }
    resolvedOptions() {
      return { locale: "en", timeZone: "UTC" };
    }
    static supportedLocalesOf() {
      return ["en"];
    }
  }
  class ListFormat {
    format(list: string[]) {
      return list.join(", ");
    }
    static supportedLocalesOf() {
      return ["en"];
    }
  }
  class RelativeTimeFormat {
    format(v: number, unit: string) {
      return `${v} ${unit}`;
    }
    static supportedLocalesOf() {
      return ["en"];
    }
  }
  class DisplayNames {
    of(code: string) {
      return code;
    }
    static supportedLocalesOf() {
      return ["en"];
    }
  }
  class Locale {
    baseName: string;
    constructor(baseName = "en") {
      this.baseName = baseName;
    }
  }
  g.Intl = { NumberFormat, PluralRules, DateTimeFormat, ListFormat, RelativeTimeFormat, DisplayNames, Locale, getCanonicalLocales: (l: unknown) => (Array.isArray(l) ? l : [l]) };
}

const win = globalThis as Record<string, unknown>
for (const name of ["addEventListener", "removeEventListener", "dispatchEvent"]) {
  if (typeof win[name] === "undefined") win[name] = () => true
}
if (typeof win.navigator === "undefined") win.navigator = { language: "en", languages: ["en"], userAgent: "ssr" }
if (typeof win.matchMedia === "undefined") win.matchMedia = () => ({ matches: false, addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop })

const serverWindow: Record<string, unknown> = { document: {}, localStorage: win.localStorage, sessionStorage: win.localStorage, addEventListener: noop, removeEventListener: noop, dispatchEvent: () => true, navigator: win.navigator, matchMedia: win.matchMedia }
if (typeof win.window === "undefined") win.window = serverWindow

export function setServerLocation(url: string, origin: string): void {
  const u = new URL(url, origin)
  const location = { origin: u.origin, protocol: u.protocol, host: u.host, hostname: u.hostname, pathname: u.pathname, search: u.search, href: u.href, hash: "" }
  serverWindow.location = location
  win.location = location
}

class ServerEvent {
  type: string
  constructor(type: string, init: Record<string, unknown> = {}) {
    this.type = type
    Object.assign(this, init)
  }
  preventDefault() {}
  stopPropagation() {}
}
class ServerEventTarget {
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true
  }
}
const stubs: Record<string, unknown> = {
  Event: ServerEvent,
  CustomEvent: ServerEvent,
  EventTarget: ServerEventTarget,
  HTMLElement: class {},
  Element: class {},
  Node: class {},
  Worker: class {},
  AbortController: win.AbortController ?? class { signal = {}; abort() {} },
}
for (const [name, value] of Object.entries(stubs)) if (typeof win[name] === "undefined") win[name] = value
