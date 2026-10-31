import type { NostrEvent } from "@snort/system"
import { useParams } from "react-router"
import { useStreamLinkFor } from "./stream-link-core"

export { nip05Address, resolveStreamLink, useStreamLinkFor } from "./stream-link-core"

export function useStreamLink(evPreload?: NostrEvent) {
  return useStreamLinkState(evPreload).link
}

export function useStreamLinkState(evPreload?: NostrEvent) {
  const params = useParams()
  return useStreamLinkFor(params.id, evPreload)
}
