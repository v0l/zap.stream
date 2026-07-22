import { ZAP_STREAM_PUBKEY } from "@/const"
import { NostrPrefix } from "@snort/shared"
import { EventKind, NostrLink } from "@snort/system"
import { useEventFeed } from "@snort/system-react"
import { type ReactNode, Suspense, lazy } from "react"

const Markdown = lazy(() => import("@/element/markdown"))

export default function MarkdownPage({ dTag, title }: { dTag: string; title: ReactNode }) {
  const faqLink = new NostrLink(NostrPrefix.Address, dTag, EventKind.LongFormTextNote, ZAP_STREAM_PUBKEY)
  const ev = useEventFeed(faqLink)
  return (
    <div className="flex flex-col gap-4 w-[45rem] mx-auto">
      <h1>{title}</h1>
      {ev && (
        <Suspense>
          <Markdown content={ev?.content} />
        </Suspense>
      )}
    </div>
  )
}
