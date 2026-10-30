import { NIP5_DOMAIN } from "@/const"
import { NostrPrefix, fetchNip05Pubkey } from "@snort/shared"
import { type NostrEvent, NostrLink, tryParseNostrLink } from "@snort/system"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router"

export function resolveStreamLink(evPreload?: NostrEvent, id?: string) {
  if (evPreload) return NostrLink.fromEvent(evPreload)
  return id ? (tryParseNostrLink(id) ?? undefined) : undefined
}

export function nip05Address(id: string) {
  const [handle, domain] = (id.includes("@") ? id : `${id}@${NIP5_DOMAIN}`).split("@")
  return { handle, domain }
}

export function useStreamLink(evPreload?: NostrEvent) {
  return useStreamLinkState(evPreload).link
}

export function useStreamLinkState(evPreload?: NostrEvent) {
  const params = useParams()
  const direct = useMemo(() => resolveStreamLink(evPreload, params.id), [evPreload?.id, params.id])
  const [nip05, setNip05] = useState<{ id: string; link?: NostrLink }>()

  useEffect(() => {
    if (direct || !params.id) return
    const id = params.id
    let active = true
    const { handle, domain } = nip05Address(id)
    fetchNip05Pubkey(handle, domain)
      .catch(() => undefined)
      .then(pubkey => {
        if (active) {
          setNip05({ id, link: pubkey ? new NostrLink(NostrPrefix.PublicKey, pubkey) : undefined })
        }
      })
    return () => {
      active = false
    }
  }, [direct, params.id])

  if (direct || !params.id) return { link: direct, notFound: false }
  const settled = nip05?.id === params.id
  return { link: settled ? nip05?.link : undefined, notFound: settled && !nip05?.link }
}
