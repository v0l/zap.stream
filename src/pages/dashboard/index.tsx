import { StreamContextProvider } from "@/element/stream/stream-state"
import { useLogin } from "@/hooks/login"
import { NostrPrefix } from "@snort/shared"
import { NostrLink } from "@snort/system"
import { useStreamLinkState } from "@/hooks/stream-link"
import { Suspense, lazy, useMemo } from "react"
import { useParams } from "react-router"
import { FormattedMessage } from "react-intl"

const DashboardForLink = lazy(() => import("./dashboard"))

export default function DashboardPage() {
  const login = useLogin()
  const { id } = useParams()
  const resolved = useStreamLinkState()
  const own = useMemo(
    () => (login?.pubkey ? new NostrLink(NostrPrefix.PublicKey, login.pubkey) : undefined),
    [login?.pubkey],
  )
  const link = id ? resolved.link : own

  if (id && resolved.notFound)
    return (
      <h2 className="p-8">
        <FormattedMessage defaultMessage="Could not find {name}" values={{ name: id }} />
      </h2>
    )
  if (id && !link) return
  if (!link)
    return (
      <h2>
        <FormattedMessage defaultMessage="Please login first." />
      </h2>
    )

  return (
    <Suspense>
      <StreamContextProvider link={link}>
        <DashboardForLink />
      </StreamContextProvider>
    </Suspense>
  )
}
