export function shouldReleasePlayer(el: { api?: unknown; isConnected: boolean } | null) {
  return Boolean(el?.api) && !el?.isConnected
}
