import { VIDEO_KIND } from "@/const"
import { Icon } from "@/element/icon"
import VideoGridSorted from "@/element/video-grid-sorted"
import { EventKind, RequestBuilder } from "@snort/system"
import { useRequestBuilder } from "@snort/system-react"
import { useMemo, useState } from "react"
import { FormattedMessage, useIntl } from "react-intl"
import { useNavigate, useParams } from "react-router"

export const SearchRelays = [
  "wss://search.nos.today",
  "wss://relay.noswhere.com",
  "wss://relay.ditto.pub",
  "wss://nostr.polyserv.xyz",
]

export default function SearchPage() {
  const { term } = useParams()
  const { formatMessage } = useIntl()
  const navigate = useNavigate()
  const [search, setSearch] = useState(term ?? "")

  const sub = useMemo(() => {
    const rb = new RequestBuilder(`search:${term}`)
    if (term) {
      rb.withFilter().relay(SearchRelays).kinds([EventKind.LiveEvent, VIDEO_KIND]).search(term).limit(50)
    }
    return rb
  }, [term])

  const results = useRequestBuilder(sub)
  return (
    <div className="flex flex-col gap-6 p-4 sm:px-8 sm:py-7 min-w-0 max-w-[1560px]">
      <div className="bg-layer-2 rounded-xl pr-4 py-1 flex items-center xl:hidden">
        <input
          type="text"
          placeholder={formatMessage({
            defaultMessage: "Search",
          })}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              navigate(`/search/${encodeURIComponent(search)}`)
            }
          }}
        />
        <Icon
          name="search"
          className="text-layer-4 ml-4 my-1"
          size={16}
          onClick={() => {
            navigate("/search")
          }}
        />
      </div>
      {term && (
        <>
          <h1 className="text-[clamp(24px,2.6vw,34px)] leading-tight">
            <FormattedMessage
              defaultMessage="Results for {term}"
              values={{
                term: <span className="text-primary">{term}</span>,
              }}
            />
          </h1>
          <VideoGridSorted evs={results} showAll={true} showVideos={true} />
        </>
      )}
    </div>
  )
}
