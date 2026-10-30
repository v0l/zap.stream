import { NIP5_DOMAIN } from "@/const"
import { NostrPrefix, fetchNip05Pubkey } from "@snort/shared"
import { type NostrEvent, NostrLink, tryParseNostrLink } from "@snort/system"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router"

export function resolveStreamLink(evPreload?: NostrEvent, id?: string) {
  if (evPreload) return NostrLink.fromEvent(evPreload)
  return id ? (tryParseNostrLink(id) ?? undefined) : undefined
}

export function useStreamLink(evPreload?: NostrEvent) {
  const params = useParams()
  const direct = useMemo(() => resolveStreamLink(evPreload, params.id), [evPreload?.id, params.id])
  const [nip05, setNip05] = useState<{ id: string; link: NostrLink }>()

  useEffect(() => {
    if (direct || !params.id) return
    const id = params.id
    let active = true
    const [handle, domain] = (id.includes("@") ? id : `${id}@${NIP5_DOMAIN}`).split("@")
    fetchNip05Pubkey(handle, domain).then(pubkey => {
      if (active && pubkey) {
        setNip05({ id, link: new NostrLink(NostrPrefix.PublicKey, pubkey) })
      }
    })
    return () => {
      active = false
    }
  }, [direct, params.id])

  if (direct) return direct
  return nip05 && nip05.id === params.id ? nip05.link : undefined
}
