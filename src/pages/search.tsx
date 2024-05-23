import { VIDEO_KIND } from "@/const";
import { Icon } from "@/element/icon";
import VideoGridSorted from "@/element/video-grid-sorted";
import { EventKind, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate, useParams } from "react-router-dom";

export const SearchRelays = [
  "wss://relay.nostr.band",
  "wss://search.nos.today",
  "wss://relay.noswhere.com",
  "wss://saltivka.org",
];

export default function SearchPage() {
  const { term } = useParams();
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const [search, setSearch] = useState(term ?? "");

  const sub = useMemo(() => {
    if (!term) return;
    const rb = new RequestBuilder(`search:${term}`);
    rb.withOptions({
      skipDiff: true
    })
    rb.withFilter()
      .relay(SearchRelays)
      .kinds([EventKind.LiveEvent, VIDEO_KIND])
      .search(term)
      .limit(50);
    return rb;
  }, [term]);

  const results = useRequestBuilder(sub);
  return (
    <div>
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
              navigate(`/search/${encodeURIComponent(search)}`);
            }
          }}
        />
        <Icon
          name="search"
          className="text-layer-4 ml-4 my-1"
          size={16}
          onClick={() => {
            navigate("/search");
          }}
        />
      </div>
      {term && (
        <>
          <h2 className="mb-4">
            <FormattedMessage
              defaultMessage="Search results: {term}"
              values={{
                term,
              }}
            />
          </h2>
          <VideoGridSorted evs={results} showAll={true} />
        </>
      )}
    </div>
  );
}
