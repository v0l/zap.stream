const APP_ROUTES = new Set([
  "debug",
  "app",
  "streams",
  "videos",
  "shorts",
  "upload",
  "t",
  "p",
  "e",
  "settings",
  "widgets",
  "summary",
  "dashboard",
  "search",
  "category",
  "faq",
  "privacy-youtube-widget",
  "providers",
  "tos",
  "login",
  "chat",
  "alert",
  "embed",
  "assets",
  "favicon",
  "manifest",
  "robots",
  "sitemap",
])

export function isNostrAddressPath(pathname: string) {
  const m = pathname.match(/^\/([a-zA-Z0-9_]+)$/)
  return m !== null && !APP_ROUTES.has(m[1].toLowerCase())
}
