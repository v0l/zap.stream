import { Icon } from "@/element/icon"
import { useState } from "react"
import { useIntl } from "react-intl"
import { useParams, useNavigate } from "react-router"

export function SearchBar() {
  const { term } = useParams()
  const { formatMessage } = useIntl()
  const navigate = useNavigate()
  const [search, setSearch] = useState(term ?? "")

  return (
    <div className="flex-1 max-w-[460px] min-w-0 flex items-center gap-2 rounded-xl px-3 py-2 bg-layer-1 border border-layer-3 focus-within:border-layer-4">
      <input
        type="text"
        className="reset bg-transparent flex-1 min-w-0 outline-none"
        placeholder={formatMessage({
          defaultMessage: "Search",
        })}
        aria-label={formatMessage({
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
        className="text-layer-4 cursor-pointer"
        size={16}
        onClick={() => {
          navigate("/search")
        }}
      />
    </div>
  )
}
